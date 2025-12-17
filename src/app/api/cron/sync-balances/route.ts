import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ethers } from 'ethers';

// Allow this to take longer than default time
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get('key');

    // Support both header (GitHub/Cron services) and query param (Manual)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && queryKey !== process.env.CRON_SECRET) {
        // Only enforce if secret is set
        if (process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // 2. Find Stale Users
        // Users who haven't been seen/synced recently, oldest first.
        const staleUsers = await prisma.user.findMany({
            orderBy: { lastSeenAt: 'asc' }, // Oldest first
            take: 50, // Process 50 at a time to stay within timeouts
            select: { walletAddress: true, shares: true }
        });

        if (staleUsers.length === 0) {
            return NextResponse.json({ message: "No users found" });
        }

        // 3. Setup Blockchain Provider
        const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS;
        if (!CORE_ADDRESS) throw new Error("Missing Core Address");

        const core = new ethers.Contract(CORE_ADDRESS, [
            "function sharesContract() view returns (address)"
        ], provider);

        const sharesAddr = await core.sharesContract();
        const sharesContract = new ethers.Contract(sharesAddr, [
            "function balanceOf(address, uint256) view returns (uint256)"
        ], provider);

        // 4. Batch Process
        const updates = [];
        const synced = [];

        for (const user of staleUsers) {
            try {
                const bal = await sharesContract.balanceOf(user.walletAddress, 1);
                const currentOnChain = Number(bal);

                // Only update if different or if we want to bump 'lastSeenAt' to cycle them to back of queue
                // We ALWAYS update 'lastSeenAt' so they go to the bottom of the 'asc' list
                await prisma.user.update({
                    where: { walletAddress: user.walletAddress },
                    data: {
                        shares: currentOnChain,
                        lastSeenAt: new Date() // Bump timestamp so they aren't picked next time
                    }
                });

                synced.push({
                    user: user.walletAddress,
                    old: user.shares,
                    new: currentOnChain
                });
            } catch (err) {
                console.error(`Failed to sync ${user.walletAddress}`, err);
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: synced.length,
            samples: synced.slice(0, 5)
        });

    } catch (error: any) {
        console.error("Cron Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
