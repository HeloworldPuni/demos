import { ethers } from 'ethers';
import prisma from './prisma';
import { indexReferral } from './clan-service';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "";
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const CORE_ABI = [
    "event Raid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 feePaid)",
    "event HighStakesRaid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 selfPenaltyShares, uint256 feePaid)",
    "event RetiredFromCartel(address indexed user, uint256 indexed season, uint256 burnedShares, uint256 payout)",
    "event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee)"
];

export async function indexEvents() {
    if (!CARTEL_CORE_ADDRESS || CARTEL_CORE_ADDRESS === "") {
        console.log("Skipping indexing: No Cartel Core Address");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, CORE_ABI, provider);

    // 1. Get last indexed block
    const lastEvent = await prisma.cartelEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
    });

    const currentBlock = await provider.getBlockNumber();
    const startBlock = lastEvent ? lastEvent.blockNumber + 1 : currentBlock - 1000; // Default to last 1000 blocks if fresh
    const endBlock = Math.min(currentBlock, startBlock + 2000); // Max 2000 blocks per run to avoid timeouts

    if (startBlock > endBlock) return;

    console.log(`Indexing events from ${startBlock} to ${endBlock}...`);

    // 2. Fetch Logs
    const raidFilter = contract.filters.Raid();
    const highStakesFilter = contract.filters.HighStakesRaid();
    const retireFilter = contract.filters.RetiredFromCartel();
    const joinFilter = contract.filters.Join();

    const [raidLogs, highStakesLogs, retireLogs, joinLogs] = await Promise.all([
        contract.queryFilter(raidFilter, startBlock, endBlock),
        contract.queryFilter(highStakesFilter, startBlock, endBlock),
        contract.queryFilter(retireFilter, startBlock, endBlock),
        contract.queryFilter(joinFilter, startBlock, endBlock)
    ]);

    // 3. Process Logs
    const eventsToCreate = [];

    for (const log of raidLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToCreate.push({
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                type: 'RAID',
                attacker: log.args[0],
                target: log.args[1],
                stolenShares: Number(log.args[2]),
                feePaid: Number(log.args[3])
            });
        }
    }

    for (const log of highStakesLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToCreate.push({
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                type: 'HIGH_STAKES_RAID',
                attacker: log.args[0],
                target: log.args[1],
                stolenShares: Number(log.args[2]),
                selfPenaltyShares: Number(log.args[3]),
                feePaid: Number(log.args[4])
            });
        }
    }

    for (const log of retireLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToCreate.push({
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                type: 'RETIRE',
                user: log.args[0],
                payout: Number(log.args[3])
            });
        }
    }

    // Process Join events
    for (const log of joinLogs) {
        if ('args' in log) {
            const player = log.args[0];
            const referrer = log.args[1];
            const sharesMinted = Number(log.args[2]);

            // 1. Sync the New User into DB (Critical for Rank/Leaderboard)
            eventsToCreate.push({
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date((await log.getBlock()).timestamp * 1000),
                type: 'JOIN', // New internal type for tracking
                attacker: player, // "Attacker" field used as generic Actor
                target: referrer,
                stolenShares: sharesMinted, // Reusing field for "Shares Minted"
                feePaid: Number(log.args[3] || 0)
            });

            // Note: Referrals are handled in processEventBatch or below? 
            // The original code handled referrals directly here. Let's keep that but ensure shares are synced.

            // Only index referral if there is a valid referrer
            if (referrer && referrer !== ethers.ZeroAddress && referrer !== player) {
                try {
                    await indexReferral(player, referrer, 1);
                } catch (err) {
                    console.error(`Failed to index referral for ${player}:`, err);
                }
            }
        }
    }

    // 4. Save to DB (Transactional Update per Event)
    await processEventBatch(eventsToCreate, prisma);

    console.log(`Indexed ${eventsToCreate.length} events and processed referrals.`);
}

/**
 * Process a batch of events transactionally.
 * Exported for testing purposes.
 */
export async function processEventBatch(events: any[], prismaClient: any) {
    // We process sequentially to avoid race conditions on the same user in a single batch
    for (const event of events) {
        try {
            await prismaClient.$transaction(async (tx: any) => {
                // 1. Create/Upsert Event
                // Ensure event exists. If it was created by API, findUnique finds it.
                // If not, upsert creates it. 
                // We use upsert to handle both cases gracefully.

                let dbEvent = await tx.cartelEvent.upsert({
                    where: { txHash: event.txHash },
                    update: {}, // No updates if exists, just retrieve
                    create: { ...event, processed: false }
                });

                // 2. Idempotency Check
                if (dbEvent.processed) {
                    // Already fully processed. Skip.
                    return;
                }

                // 2. Process Shares for Raids
                if (event.type === 'RAID' || event.type === 'HIGH_STAKES_RAID') {
                    const stolen = Math.floor(event.stolenShares || 0);
                    const penalty = Math.floor(event.selfPenaltyShares || 0);

                    // Update Attacker: +Stolen, -Penalty
                    if (event.attacker) {
                        await tx.user.upsert({
                            where: { walletAddress: event.attacker },
                            update: {
                                shares: { increment: stolen - penalty },
                                lastSeenAt: new Date()
                            },
                            create: {
                                walletAddress: event.attacker,
                                shares: Math.max(0, stolen - penalty),
                                active: true
                            }
                        });
                    }

                    // Update Target: -Stolen
                    if (event.target) {
                        const targetUser = await tx.user.findUnique({ where: { walletAddress: event.target } });
                        if (targetUser) {
                            const current = targetUser.shares || 0;
                            const newAmount = Math.max(0, current - stolen);
                            await tx.user.update({
                                where: { walletAddress: event.target },
                                data: { shares: newAmount }
                            });
                        }
                    }

                    console.log(`[Indexer] Processed shares for ${event.type} TX ${event.txHash}: +${stolen} to ${event.attacker}, -${stolen} from ${event.target}`);
                }

                // 3. Process Join (Sync Initial Shares)
                if (event.type === 'JOIN') {
                    const shares = Math.floor(event.stolenShares || 0); // stored in stolenShares field
                    if (event.attacker) { // 'attacker' stores player address
                        await tx.user.upsert({
                            where: { walletAddress: event.attacker },
                            update: {
                                shares: { set: shares }, // Start with fresh shares or overwrite
                                lastSeenAt: new Date(),
                                active: true
                            },
                            create: {
                                walletAddress: event.attacker,
                                shares: shares,
                                active: true
                            }
                        });
                        console.log(`[Indexer] Synced JOIN for ${event.attacker}: ${shares} shares`);
                    }
                }

                // 4. Mark as Processed (Atomic)
                await tx.cartelEvent.update({
                    where: { id: dbEvent.id },
                    data: { processed: true }
                });
            });
        } catch (e) {
            // @ts-ignore
            if (e.code === 'P2002') {
                // Duplicate ignored
            } else {
                console.error(`Failed to process event ${event.txHash}:`, e);
            }
        }
    }
}
