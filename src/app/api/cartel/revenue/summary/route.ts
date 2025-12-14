import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Aggregate 24h Revenue
        const agg = await prisma.revenueTransaction.aggregate({
            _sum: { amount: true },
            where: {
                createdAt: { gte: yesterday }
            }
        });

        // Count 24h Raids (just for fun stats)
        const count = await prisma.revenueTransaction.count({
            where: {
                createdAt: { gte: yesterday },
                type: { in: ['RAID', 'HIGH_STAKES'] }
            }
        });

        const revenue24h = agg._sum.amount || 0;

        return NextResponse.json({
            revenue24h,
            count24h: count,
            success: true
        });

    } catch (error) {
        console.error("Revenue Summary Error:", error);
        return NextResponse.json({ revenue24h: 0, error: String(error) }, { status: 500 });
    }
}
