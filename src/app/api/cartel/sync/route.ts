import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFrameMessage } from "frames.js"; // Optional validation if we wanted specific auth usually

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { address, shares } = body;

        if (!address || typeof shares !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const walletAddress = address.toLowerCase();

        // Upsert the user with the authoritative on-chain data
        const user = await prisma.user.upsert({
            where: { walletAddress },
            update: {
                shares: shares,
                lastSeenAt: new Date()
            },
            create: {
                walletAddress,
                shares: shares,
                lastSeenAt: new Date()
            }
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
