import { NextResponse } from 'next/server';
import { indexEvents } from '@/lib/indexer-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for indexing

export async function GET(request: Request) {
    try {
        // Optional: Add Bearer token check for Cron jobs
        // const auth = request.headers.get('Authorization');
        // if (auth !== `Bearer ${process.env.CRON_SECRET}`) ...

        console.log("[Cron] Triggering Indexer...");
        await indexEvents();
        return NextResponse.json({ success: true, message: "Indexing complete" });
    } catch (error) {
        console.error("[Cron] Indexing failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return GET(request);
}
