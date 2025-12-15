
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuestEngine } from '@/lib/quest-engine';
import { indexEvents } from '@/lib/indexer-service';

export const dynamic = 'force-dynamic';

// Patch BigInt serialization for JSON response
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const logs: string[] = [];

    // Hijack console.log to capture trace
    const originalLog = console.log;
    console.log = (...args) => {
        logs.push(args.map(a => JSON.stringify(a)).join(' '));
        originalLog(...args);
    };

    try {
        logs.push("--- DEBUG START ---");

        // 1. Force Index
        logs.push("Running Indexer...");
        await indexEvents();

        // 2. Force Engine
        logs.push("Running Quest Engine...");
        await QuestEngine.processPendingEvents();

        // 3. Dump State
        if (address) {
            const user = await prisma.user.findUnique({
                where: { walletAddress: address },
                include: { questProgress: true } // V1
            });

            if (user) {
                const progressV2 = await prisma.questProgressV2.findMany({
                    where: { userId: user.id }
                });
                return NextResponse.json({
                    user: { id: user.id, wallet: user.walletAddress, rep: user.rep },
                    progressV2,
                    logs
                });
            } else {
                return NextResponse.json({ error: "User not found", logs });
            }
        }

        return NextResponse.json({ message: "Run completed", logs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack, logs }, { status: 500 });
    } finally {
        console.log = originalLog; // Restore
    }
}
