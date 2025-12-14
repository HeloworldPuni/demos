import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { txHash, amount, type, actor } = body;

        if (!txHash || amount === undefined || !type || !actor) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Idempotency: Try to create, if exists (unique constraint), just return success
        try {
            await prisma.revenueTransaction.create({
                data: {
                    txHash,
                    amount: Number(amount),
                    type, // 'RAID' | 'HIGH_STAKES'
                    actor
                }
            });
            return NextResponse.json({ success: true, status: 'created' });
        } catch (error: any) {
            // Prisma code P2002 is Unique Constraint Violation
            if (error.code === 'P2002') {
                return NextResponse.json({ success: true, status: 'exists' });
            }
            throw error;
        }

    } catch (error) {
        console.error("Revenue Record Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
