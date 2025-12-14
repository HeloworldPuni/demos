import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ethers } from 'ethers';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "";
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const ABI = [
    "event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee)"
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, inviteCode } = body;

        if (!address) {
            return NextResponse.json({ error: "Address required" }, { status: 400 });
        }

        console.log(`[Sync] Syncing user ${address} from chain...`);

        // 1. Fetch recent Join events
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, ABI, provider);

        // Look back 100 blocks
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock - 200;

        const events = await contract.queryFilter(contract.filters.Join(address), startBlock, 'latest');

        if (events.length === 0) {
            // If checking explicitly for a recent join, this might be an error. 
            // BUT, if the user joined long ago, this API might not find the event.
            // In V5, we rely on `api/me/invites` for membership check via balanceOf.
            // This sync API is primarily for *immediate* post-join updates.
            return NextResponse.json({ message: "No recent Join event found" });
        }

        const recentJoin = events[events.length - 1]; // Latest join
        const args = (recentJoin as any).args;
        const player = args[0];
        const referrer = args[1];
        const shares = Number(args[2]);

        // 2. Upsert User
        const user = await prisma.user.upsert({
            where: { walletAddress: player },
            update: { active: true, shares: shares },
            create: { walletAddress: player, active: true, shares: shares }
        });

        // 3. Link Referrer (if valid)
        if (referrer && referrer !== ethers.ZeroAddress) {
            await prisma.user.upsert({
                where: { walletAddress: referrer },
                update: {},
                create: { walletAddress: referrer, active: true }
            });

            await prisma.cartelReferral.upsert({
                where: { userAddress: player },
                update: {},
                create: {
                    userAddress: player,
                    referrerAddress: referrer,
                    season: 1
                }
            });
        }

        // 4. Mark Invite Used
        if (inviteCode && !inviteCode.startsWith('0x')) {
            await prisma.invite.update({
                where: { code: inviteCode },
                data: {
                    usedCount: { increment: 1 },
                    status: 'used' // Simple toggle for now, usually depends on maxUses
                }
            }).catch(e => console.log("Invite update failed (might be invalid code):", e));
        }

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error("[Sync] Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
