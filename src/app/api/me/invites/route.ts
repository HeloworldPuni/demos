import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "";
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const ABI = [
    "function balanceOf(address account, uint256 id) view returns (uint256)"
];

const SHARES_ID = 1;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // 1. Resolve User & Check DB Invites
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: { invites: { orderBy: { createdAt: 'desc' } } }
        });

        // 2. If invites exist, return them IMMEDIATELY (Idempotent)
        if (user && user.invites.length > 0) {
            return NextResponse.json({
                invites: user.invites.map(invite => ({
                    code: invite.code,
                    status: invite.status,
                    type: invite.type,
                    createdAt: invite.createdAt,
                }))
            });
        }

        // 3. User has no invites. Verify Membership ON-CHAIN.
        // We use a provider to check the contract state directly.
        // This is the "Source of Truth" check.
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, ABI, provider);

        let balance = BigInt(0);
        try {
            balance = await contract.balanceOf(walletAddress, SHARES_ID);
        } catch (chainError) {
            console.error("Chain verification failed:", chainError);
            // If chain is unreachable, we can't verify. Fail safe.
            return NextResponse.json({ error: "Unable to verify membership on-chain" }, { status: 503 });
        }

        if (balance === BigInt(0)) {
            // Not a member? No invites.
            return NextResponse.json({ error: "User is not a joined member" }, { status: 403 });
        }

        // 4. User IS a member but has no invites. GENERATE NOW (Synchronous).
        console.log(`[InvitesV5] Generating invites for connected member: ${walletAddress}`);

        // Ensure user exists in DB (Upsert to be safe, though they should exist if they routed here)
        // If they joined on chain but indexer missed them, this creates the DB record too!
        const dbUser = await prisma.user.upsert({
            where: { walletAddress },
            update: { active: true },
            create: { walletAddress, active: true, shares: 100 } // Default shares, will be corrected by sync later
        });

        const newInvitesData = Array.from({ length: 3 }).map(() => ({
            code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
            creatorId: dbUser.id,
            type: 'user',
            maxUses: 1, // V5 Rule: maxUses = 1
            status: 'unused',
            usedCount: 0
        }));

        // Atomic Transaction
        await prisma.$transaction(
            newInvitesData.map(inv => prisma.invite.create({ data: inv }))
        );

        return NextResponse.json({
            invites: newInvitesData.map(inv => ({
                code: inv.code,
                status: inv.status,
                type: inv.type,
                // createdAt won't be exact from DB here without refetch, but close enough for UI
                createdAt: new Date()
            }))
        });

    } catch (error) {
        console.error('Error in V5 Invite API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
