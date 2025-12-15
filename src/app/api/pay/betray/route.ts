import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import prisma from '@/lib/prisma';
import { ClanService } from '@/lib/clan-service';
import { neynarService } from '@/lib/neynar-service';

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function POST(request: Request) {
    try {
        constbody = await request.json();
        const { traitorAddress, txHash } = await request.json();

        // Validate required fields
        if (!traitorAddress || !ethers.isAddress(traitorAddress)) {
            return NextResponse.json(
                { error: 'Invalid traitor address' },
                { status: 400 }
            );
        }

        // If txHash provided, verify transaction was successful
        if (txHash) {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const receipt = await provider.getTransactionReceipt(txHash);

            if (!receipt || receipt.status !== 1) {
                return NextResponse.json(
                    { error: 'Transaction failed or not found' },
                    { status: 400 }
                );
            }

            // Verify the sender matches the traitor
            if (receipt.from.toLowerCase() !== traitorAddress.toLowerCase()) {
                return NextResponse.json(
                    { error: 'Transaction sender mismatch' },
                    { status: 403 }
                );
            }

            // 1. Resolve User ID
            const user = await prisma.user.findUnique({
                where: { walletAddress: traitorAddress }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
            }

            // 2. Execute Betrayal (DB Cleanup)
            try {
                await ClanService.betrayClan(user.id);
            } catch (e: any) {
                // If user is already not in clan, that's fine (idempotent), strictly strictly speaking
                // But if they are owner, it throws.
                console.error("Betrayal Service Error:", e.message);
                if (e.message.includes("Owner")) {
                    return NextResponse.json({ error: e.message }, { status: 403 });
                }
            }

            // 3. Social Blast (Fire & Forget)
            try {
                // Mock amount for now or parse logs if we had ABI here
                await neynarService.postBetrayalEvent(traitorAddress, 0);
            } catch (socialError) {
                console.error("Social post failed:", socialError);
            }

            return NextResponse.json({
                success: true,
                message: 'Betrayal complete. You are now lone wolf.',
            });
        }

        // Default: Return metadata for confirmation/signing UI if no hash
        return NextResponse.json({
            success: true,
            message: "Ready to sign",
            metadata: {
                action: 'betray',
                traitorAddress,
                contractAddress: CARTEL_CORE_ADDRESS,
                warning: 'IRREVERSIBLE: Burns shares and reputation.'
            }
        });

    } catch (error) {
        console.error('[/api/pay/betray] Error:', error);
        return NextResponse.json(
            {
                error: 'Processing failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
