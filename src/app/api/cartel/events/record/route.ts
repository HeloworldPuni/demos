import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNewsFromEvents } from '@/lib/news-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { txHash, type, attacker, target, stolenShares, selfPenaltyShares, payout } = body;

        // Validation
        if (!txHash || !type || !attacker) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if event already exists (idempotency)
        const existing = await prisma.cartelEvent.findUnique({
            where: { txHash }
        });

        if (existing) {
            return NextResponse.json({ message: 'Event already recorded' });
        }

        // Create Event
        await prisma.cartelEvent.create({
            data: {
                txHash,
                blockNumber: 0, // Frontend doesn't always have this immediately, or we interpret 0 as "pending sync"
                timestamp: new Date(),
                type, // 'RAID', 'HIGH_STAKES_RAID', 'RETIRE'
                attacker,
                target,
                stolenShares: stolenShares ? Number(stolenShares) : null,
                selfPenaltyShares: selfPenaltyShares ? Number(selfPenaltyShares) : null,
                payout: payout ? Number(payout) : null,
            }
        });

        // Trigger News Generation Immediately for instant UI feedback
        await generateNewsFromEvents();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Record Event Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
