import { NextResponse } from 'next/server';
import { getThreatStats } from '@/lib/threat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const stats = await getThreatStats(address);

        return NextResponse.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Profile Stats API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
