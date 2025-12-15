import { NextResponse } from 'next/server';
import { indexEvents } from '@/lib/indexer-service';
import { QuestEngine } from '@/lib/quest-engine';


export async function GET(request: Request) {
    console.log("CRON ENDPOINT HIT"); // Proof of Life
    try {
        const url = new URL(request.url);
        // Verify Cron Secret OR Debug Bypass
        const authHeader = request.headers.get('authorization');
        const isDebug = url.searchParams.get('debug') === 'true';

        if (!isDebug && authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
            console.log("Cron Unauthorized");
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await indexEvents();

        // Trigger Quest Engine to process new events immediately
        await QuestEngine.processPendingEvents();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Indexing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
