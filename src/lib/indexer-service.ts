import { ethers } from 'ethers';
import prisma from './prisma';
import { v4 as uuidv4 } from 'uuid';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "0xD8E9b929b1a8c43075CDD7580a4a717C0D5530E208";
// Fix: Use Sepolia RPC by default for this testnet deployment
const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const CORE_ABI = [
    "event Raid(address indexed raider, address indexed target, uint256 amountStolen, bool success, uint256 fee)",
    "event HighStakesRaid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 selfPenaltyShares, uint256 feePaid)",
    "event RetiredFromCartel(address indexed user, uint256 indexed season, uint256 burnedShares, uint256 payout)",
    "event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee)",
    "event ProfitClaimed(address indexed user, uint256 amount)"
];

export async function indexEvents() {
    if (!CARTEL_CORE_ADDRESS) {
        console.log("Skipping indexing: No Cartel Core Address");
        return;
    }

    // Usable Provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Explicitly set network to ensure we don't accidentally fallback
    // provider._detectNetwork(); // Ethers v6 auto-detects

    const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, CORE_ABI, provider);

    // 1. Get Range
    const lastEvent = await prisma.cartelEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
    });

    const currentBlock = await provider.getBlockNumber();
    console.log(`[Indexer] Current Chain Block: ${currentBlock}`);

    let startBlock = lastEvent ? lastEvent.blockNumber + 1 : currentBlock - 2000;

    // Safety: If DB is empty or weird, don't start at 0 if chai is huge.
    // Base Sepolia is ~19M. If startBlock is small, it takes forever.
    // We only care about Recent History for this Demo.
    if (startBlock < currentBlock - 10000) {
        console.log(`[Indexer] DB is too far behind (Block ${startBlock}). Fast-forwarding to tip - 2000.`);
        startBlock = currentBlock - 2000;
    }

    const endBlock = Math.min(currentBlock, startBlock + 2000);

    if (startBlock > endBlock) {
        console.log("[Indexer] Up to date.");
        return;
    }

    console.log(`[Indexer] Indexing blocks ${startBlock} to ${endBlock}...`);

    // 2. Query All Events
    const [raidLogs, highStakesLogs, retireLogs, joinLogs, claimLogs] = await Promise.all([
        contract.queryFilter(contract.filters.Raid(), startBlock, endBlock),
        contract.queryFilter(contract.filters.HighStakesRaid(), startBlock, endBlock),
        contract.queryFilter(contract.filters.RetiredFromCartel(), startBlock, endBlock),
        contract.queryFilter(contract.filters.Join(), startBlock, endBlock),
        contract.queryFilter(contract.filters.ProfitClaimed(), startBlock, endBlock)
    ]);

    const eventsToProcess = [];

    // TRANSFORM LOGS
    const safeNumber = (n: any) => {
        if (n === null || n === undefined) return 0;
        return Number(n);
    };

    for (const log of raidLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            const fee = safeNumber(log.args[4]); // Index 4 is Fee
            console.log(`[Indexer] Raid found. FeeRaw: ${log.args[4]}, Extracted: ${fee}`);

            eventsToProcess.push({
                type: 'RAID',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0],
                target: log.args[1],
                stolenShares: safeNumber(log.args[2]),
                fee: fee,
                rawArgs: log.args // Capture full args for debugging
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

    for (const log of claimLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToProcess.push({
                type: 'CLAIM',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // User
                fee: safeNumber(log.args[1]) // Actually 'amount'
            });
        }
    }

    // 3. Process Batch
    await processEventBatch(eventsToProcess);

    console.log(`[Indexer] Processed ${eventsToProcess.length} events.`);
}

async function processEventBatch(events: any[]) {
    for (const event of events) {
        // Idempotency: We used to skip, but now we allow re-processing to fix data (e.g. fees)
        const exists = await prisma.cartelEvent.findUnique({ where: { txHash: event.txHash } });
        // if (exists && exists.processed) continue; // DISABLED TO FORCE REPAIR

        console.log(`[Indexer] Processing ${event.type}.`);
        const feeFinal = event.fee ? Number(event.fee) : 0;

        // DEBUG LOGGING REQUESTED BY USER
        console.log("INSERTING EVENT:", {
            type: event.type,
            feePaid: feeFinal,
            rawArgs: event.rawArgs ? JSON.stringify(event.rawArgs, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ) : "N/A"
        });

        await prisma.$transaction(async (tx) => {
            // A. Create Event Record (Legacy / V1)
            await tx.cartelEvent.upsert({
                where: { txHash: event.txHash },
                update: {
                    feePaid: feeFinal,
                    processed: true
                },
                create: {
                    txHash: event.txHash,
                    blockNumber: event.blockNumber,
                    timestamp: event.timestamp,
                    type: event.type,
                    attacker: event.attacker,
                    target: event.target,
                    stolenShares: event.stolenShares,
                    selfPenaltyShares: event.penalty, // for High Stakes
                    feePaid: feeFinal, // For CLAIM this is amount
                    processed: true
                }
            });

            // B. Route Logic (V1)
            if (event.type === 'JOIN') {
                await handleJoinEvent(tx, event);

                // V2 QUEST EVENT: JOIN
                await tx.questEvent.create({
                    data: {
                        type: 'JOIN',
                        actor: event.attacker,
                        data: {
                            referrer: event.target,
                            shares: event.stolenShares
                        },
                        processed: false,
                        createdAt: event.timestamp
                    }
                });

            } else if (event.type === 'RAID' || event.type === 'HIGH_STAKES_RAID') {
                await handleRaidEvent(tx, event);

                // V2 QUEST EVENT: RAID
                await tx.questEvent.create({
                    data: {
                        type: event.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID',
                        actor: event.attacker,
                        data: {
                            target: event.target,
                            stolen: event.stolenShares,
                            penalty: event.penalty || 0,
                            success: true // If log exists, it succeeded
                        },
                        processed: false,
                        createdAt: event.timestamp
                    }
                });
            } else if (event.type === 'CLAIM') {
                await tx.questEvent.create({
                    data: {
                        type: 'CLAIM',
                        actor: event.attacker,
                        data: {
                            amount: feeFinal
                        },
                        processed: false,
                        createdAt: event.timestamp
                    }
                });
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
            lastSeenAt: event.timestamp
        },
        create: {
            walletAddress: playerAddr,
            shares: sharesMinted
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
            create: { walletAddress: referrerAddr }
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

            // V2 QUEST EVENT: REFER (Triggered for the Referrer)
            // Note: We create a separate event for the Referrer to count towards "Refer a friend" quest
            await tx.questEvent.create({
                data: {
                    type: 'REFER',
                    actor: referrerAddr,
                    data: {
                        referee: playerAddr,
                        season: 1
                    },
                    processed: false,
                    createdAt: event.timestamp
                }
            });
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

