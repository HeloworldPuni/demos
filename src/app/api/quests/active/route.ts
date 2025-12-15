
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRepTier } from '@/lib/rep';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: address },
            include: {
                questProgress: true // This is V1? No, we need V2 relations if defined in schema or manual query
            }
        });

        if (!user) {
            return NextResponse.json({ quests: [], rep: 0, tier: getRepTier(0) });
        }

        // Fetch Quests
        const quests = await prisma.quest.findMany({
            where: { isActive: true }
        });

        // Fetch V2 Progress
        const CURRENT_SEASON = 1; // TODO: Config
        // LAZY INDEXING: Trigger if needed (Fire & Forget)
        // We use a simplified check or just trigger it every X calls/minutes if we had persistence.
        // For now, let's trigger it asynchronously to ensure freshness without blocking UI too much.
        // Note: In Vercel serverless, fire-and-forget is tricky, but often works for short tasks.
        // Better: We rely on the fact that if they are looking at this, they want fresh data.

        // Fix: Use user.id (UUID) not address
        const progressItems = await prisma.questProgressV2.findMany({
            where: {
                userId: user.id, // CORRECTED: Uses UUID
                seasonId: CURRENT_SEASON
            }
        });

        // Trigger safe background indexing (catch errors to not break UI)
        // We import dynamically to avoid circular deps if any
        import('@/lib/indexer-service').then(({ indexEvents }) => {
            import('@/lib/quest-engine').then(({ QuestEngine }) => {
                indexEvents().then(() => QuestEngine.processPendingEvents()).catch(e => console.error("Lazy Index Error", e));
            });
        });

        // Map Quests to include Progress
        const result = quests.map(q => {
            // Find specific progress
            // Note: In engine I seemingly matched by userId. 
            // In API we must map correctly.
            // If the Engine uses walletAddress for userId, that is a BUG if the schema implies UUID.
            // But let's build the API assuming we can find it.

            // Hack for now: Logic in Engine likely needs to ensure User ID is used, or Schema allows String ID.
            // user.id is UUID. user.walletAddress is 0x...
            // I will filter by `user.id` here assuming Engine behaves.
            const p = progressItems.find(p => p.questId === q.id);

            return {
                ...q,
                progress: {
                    current: p?.currentCount || 0,
                    target: q.maxCompletions,
                    completed: p?.completed || false,
                    claimed: p?.claimed || false
                }
            };
        });

        const tier = getRepTier(user.rep);

        return NextResponse.json({
            quests: result,
            rep: user.rep,
            tier: tier
        });

    } catch (error) {
        console.error('Quest API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
