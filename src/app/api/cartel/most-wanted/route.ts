import { NextResponse } from 'next/server';
import { getMostWanted } from '@/lib/threat-service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Number(searchParams.get('limit')) || 10, 20);
        const windowHours = Math.min(Number(searchParams.get('windowHours')) || 24, 168);

        const players = await getMostWanted(limit, windowHours);

        return NextResponse.json({
            windowHours,
            generatedAt: new Date().toISOString(),
            players
        });
    } catch (error) {
        console.error('Most Wanted API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
