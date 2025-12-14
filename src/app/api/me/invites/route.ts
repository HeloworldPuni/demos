import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const CARTEL_SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS || "";

// Fallback chain: Env Var -> Next Public Env Var -> Reliable Public Node -> Base Sepolia Official
const RPC_URL = process.env.BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://base-sepolia-rpc.publicnode.com';



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
        console.log(`[InvitesV5] Verifying ${walletAddress} shares on chain (RPC: ${RPC_URL})...`);
        // 3. User has no invites. Verify Membership ON-CHAIN.
        console.log(`[InvitesV5] Verifying ${walletAddress} shares on chain (RPC: ${RPC_URL})...`);

        let balance = BigInt(0);
        try {
            if (!CARTEL_SHARES_ADDRESS) {
                throw new Error("CARTEL_SHARES_ADDRESS env var is missing");
            }
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CARTEL_SHARES_ADDRESS, ABI, provider);
            balance = await contract.balanceOf(walletAddress, SHARES_ID);
            console.log(`[InvitesV5] Balance for ${walletAddress}: ${balance.toString()}`);
        } catch (chainError) {
            console.error("Chain verification failed:", chainError);
            return NextResponse.json({
                error: "Unable to verify membership on-chain",
                details: String(chainError),
                rpcUsed: RPC_URL,
                contractAddress: CARTEL_SHARES_ADDRESS,
                contractConfigured: !!CARTEL_SHARES_ADDRESS
            }, { status: 503 });
        }

        if (balance === BigInt(0)) {
            // Not a member? No invites.
            return NextResponse.json({ error: "User is not a joined member" }, { status: 403 });
        }

        // 4. User IS a member but has no invites. GENERATE NOW.
        // ... (rest of logic)

    } catch (error) {
        console.error('Error in V5 Invite API:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: String(error) // Exposed for debugging
        }, { status: 500 });
    }
}
