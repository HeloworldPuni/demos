
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ address: string }> }) {
    try {
        const { address } = await context.params;

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { walletAddress: { equals: address, mode: 'insensitive' } },
            select: {
                walletAddress: true,
                farcasterId: true
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Return Farcaster details (we don't store display name yet, but Farcaster ID is key)
        // If we had a sync service, we'd fetch the name here.
        // For now, we return valid FID so frontend can use Neynar or similar if needed.
        return NextResponse.json({
            success: true,
            user: {
                address: user.walletAddress,
                fid: user.farcasterId
            }
        });
    } catch (error) {
        console.error('User Info API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
