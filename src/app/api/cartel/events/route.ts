import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
        const type = searchParams.get('type');

        const where = type ? { type } : {};

        const events = await prisma.cartelEvent.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Events API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
