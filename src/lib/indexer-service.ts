import { ethers } from 'ethers';
import prisma from './prisma';
import { v4 as uuidv4 } from 'uuid';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "";
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const CORE_ABI = [
    "event Raid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 feePaid)",
    "event HighStakesRaid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 selfPenaltyShares, uint256 feePaid)",
    "event RetiredFromCartel(address indexed user, uint256 indexed season, uint256 burnedShares, uint256 payout)",
    "event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee)"
];

export async function indexEvents() {
    if (!CARTEL_CORE_ADDRESS) {
        console.log("Skipping indexing: No Cartel Core Address");
        return;
    }

    // Usable Provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, CORE_ABI, provider);

    // 1. Get Range
    const lastEvent = await prisma.cartelEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
    });

    const currentBlock = await provider.getBlockNumber();
    const startBlock = lastEvent ? lastEvent.blockNumber + 1 : currentBlock - 2000;
    const endBlock = Math.min(currentBlock, startBlock + 2000);

    if (startBlock > endBlock) return;

    console.log(`[Indexer] Indexing blocks ${startBlock} to ${endBlock}...`);

    // 2. Query All Events
    const [raidLogs, highStakesLogs, retireLogs, joinLogs] = await Promise.all([
        contract.queryFilter(contract.filters.Raid(), startBlock, endBlock),
        contract.queryFilter(contract.filters.HighStakesRaid(), startBlock, endBlock),
        contract.queryFilter(contract.filters.RetiredFromCartel(), startBlock, endBlock),
        contract.queryFilter(contract.filters.Join(), startBlock, endBlock)
    ]);

    const eventsToProcess = [];

    // TRANSFORM LOGS
    const safeNumber = (n: any) => Number(n || 0);

    for (const log of raidLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToProcess.push({
                type: 'RAID',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0],
                target: log.args[1],
                stolenShares: safeNumber(log.args[2]),
                fee: safeNumber(log.args[3])
            });
        }
    }

    for (const log of highStakesLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToProcess.push({
                type: 'HIGH_STAKES_RAID',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // Traitor
                target: log.args[1],   // Victim
                stolenShares: safeNumber(log.args[2]),
                penalty: safeNumber(log.args[3]),
                fee: safeNumber(log.args[4])
            });
        }
    }

    for (const log of joinLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            // args: [player, referrer, shares, fee]
            eventsToProcess.push({
                type: 'JOIN',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // Player
                target: log.args[1],   // Referrer
                stolenShares: safeNumber(log.args[2]), // Initial Shares
                fee: safeNumber(log.args[3])
            });
        }
    }

    // 3. Process Batch
    await processEventBatch(eventsToProcess);

    console.log(`[Indexer] Processed ${eventsToProcess.length} events.`);
}

async function processEventBatch(events: any[]) {
    for (const event of events) {
        // Idempotency: skip if txHash exists
        const exists = await prisma.cartelEvent.findUnique({ where: { txHash: event.txHash } });
        if (exists && exists.processed) continue;

        await prisma.$transaction(async (tx) => {
            // A. Create Event Record
            await tx.cartelEvent.upsert({
                where: { txHash: event.txHash },
                update: {},
                create: {
                    txHash: event.txHash,
                    blockNumber: event.blockNumber,
                    timestamp: event.timestamp,
                    type: event.type,
                    attacker: event.attacker,
                    target: event.target,
                    stolenShares: event.stolenShares,
                    selfPenaltyShares: event.penalty, // for High Stakes
                    feePaid: event.fee,
                    processed: true
                }
            });

            // B. Route Logic
            if (event.type === 'JOIN') {
                await handleJoinEvent(tx, event);
            } else if (event.type === 'RAID' || event.type === 'HIGH_STAKES_RAID') {
                await handleRaidEvent(tx, event);
            }
        });
    }
}

async function handleJoinEvent(tx: any, event: any) {
    const playerAddr = event.attacker;
    const referrerAddr = event.target;
    const sharesMinted = event.stolenShares;

    console.log(`[Indexer] Processing JOIN for ${playerAddr} (Referrer: ${referrerAddr})`);

    // 1. Upsert Player (The User)
    const user = await tx.user.upsert({
        where: { walletAddress: playerAddr },
        update: {
            shares: sharesMinted, // Authoritative Source
            active: true,
            lastSeenAt: event.timestamp
        },
        create: {
            walletAddress: playerAddr,
            shares: sharesMinted,
            active: true
        }
    });

    // 2. Handle Referral
    if (referrerAddr && referrerAddr !== ethers.ZeroAddress && referrerAddr !== playerAddr) {

        // Upsert Referrer (Ensure they exist in DB)
        // We do NOT update their shares here; the contract likely minted referral bonus to them,
        // but we would need to check their balance or wait for a Transfer event to know exactly.
        // For now, we trust the contract logic: `Join` event implies Referrer got +20.
        // Ideally we'd read their balance, but simpler to just track the relationship.

        await tx.user.upsert({
            where: { walletAddress: referrerAddr },
            update: { lastSeenAt: event.timestamp },
            create: { walletAddress: referrerAddr, active: true }
        });

        // Create Referral Record
        const existingRef = await tx.cartelReferral.findUnique({
            where: { userAddress: playerAddr }
        });

        if (!existingRef) {
            await tx.cartelReferral.create({
                data: {
                    userAddress: playerAddr,
                    referrerAddress: referrerAddr,
                    season: 1
                }
            });
            console.log(`[Indexer] Linked ${playerAddr} -> ${referrerAddr}`);

            // Increment Referrer Count
            // (Wait, we can't increment specific Invite usage because we don't know the code)
            // But we CAN generic increment database counters if we want.
            // Or just rely on the count of `CartelReferral` records.
        }
    }

    // 3. INVITE GENERATION -> MOVED TO LAZY API (V5)
    // We no longer generate invites here.
    // They are generated synchronously on-demand when the user visits the referral UI.
}

async function handleRaidEvent(tx: any, event: any) {
    const { attacker, target, stolenShares, penalty } = event;
    const totalChange = stolenShares - (penalty || 0);

    // Update Attacker
    if (attacker) {
        await tx.user.upsert({
            where: { walletAddress: attacker },
            update: { shares: { increment: totalChange } },
            create: { walletAddress: attacker, shares: Math.max(0, totalChange) }
        });
    }

    // Update Target
    if (target) {
        const tUser = await tx.user.findUnique({ where: { walletAddress: target } });
        if (tUser) {
            const newBal = Math.max(0, (tUser.shares || 0) - stolenShares);
            await tx.user.update({
                where: { walletAddress: target },
                data: { shares: newBal }
            });
        }
    }
}
