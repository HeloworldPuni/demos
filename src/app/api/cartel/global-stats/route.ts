import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Calculate 24h Revenue (Sum of all feePaid)
        const revenueAgg = await prisma.cartelEvent.aggregate({
            _sum: {
                feePaid: true
            },
            where: {
                timestamp: { gte: yesterday }
            }
        });

        // Calculate Total Raids 24h
        const raids24h = await prisma.cartelEvent.count({
            where: {
                timestamp: { gte: yesterday },
                type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
            }
        });

        const dailyRevenue = revenueAgg._sum.feePaid || 0;

        return NextResponse.json({
            dailyRevenue, // Can be used directly (it's already a float from Prisma)
            raids24h,
            success: true
        });
    } catch (error) {
        console.error("Global Stats Error:", error);
        return NextResponse.json({ dailyRevenue: 0, raids24h: 0, error: String(error) }, { status: 500 });
    }
}
