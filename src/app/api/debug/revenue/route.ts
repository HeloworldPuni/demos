import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("--- DEBUG REVENUE API ---");

        // 1. ALL TIME
        const allTimeAgg = await prisma.cartelEvent.aggregate({
            _sum: { feePaid: true }
        });
        const allTimeCount = await prisma.cartelEvent.count();

        // 2. LAST 24H
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentAgg = await prisma.cartelEvent.aggregate({
            _sum: { feePaid: true },
            where: { timestamp: { gte: yesterday } }
        });
        const recentCount = await prisma.cartelEvent.count({
            where: { timestamp: { gte: yesterday } }
        });

        // 3. SAMPLES
        const samples = await prisma.cartelEvent.findMany({
            where: { timestamp: { gte: yesterday } },
            orderBy: { timestamp: 'desc' },
            take: 5,
            select: { id: true, type: true, feePaid: true, timestamp: true }
        });

        return NextResponse.json({
            allTime: {
                count: allTimeCount,
                sum: allTimeAgg._sum.feePaid
            },
            recent: {
                count: recentCount,
                sum: recentAgg._sum.feePaid
            },
            samples
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
