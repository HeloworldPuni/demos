
import prisma from '@/lib/prisma';
import { getLeaderboard } from '@/lib/leaderboard-service';

export const dynamic = 'force-dynamic';

export default async function DebugLeaderboardPage() {
    // 1. Check Raw DB Connection
    const userCount = await prisma.user.count();

    // 2. Check Raw Data
    const topUsers = await prisma.user.findMany({
        orderBy: { shares: 'desc' },
        take: 5,
        select: { walletAddress: true, shares: true }
    });

    // 3. Check Service Output
    const serviceResult = await getLeaderboard(5, 1);

    return (
        <div className="p-8 bg-black text-white font-mono text-sm min-h-screen">
            <h1 className="text-2xl font-bold text-red-500 mb-6">SYSTEM DIAGNOSTICS: LEADERBOARD</h1>

            <div className="grid gap-6">
                <div className="border border-zinc-800 p-4 rounded">
                    <h2 className="text-blue-400 font-bold mb-2">1. DATABASE STATE</h2>
                    <div>Total Users: {userCount}</div>
                    <div className="mt-2 text-zinc-500">
                        {userCount === 0 ? "⚠️ CRITICAL: Database is empty." : "OK: Users found."}
                    </div>
                </div>

                <div className="border border-zinc-800 p-4 rounded">
                    <h2 className="text-green-400 font-bold mb-2">2. RAW TABLE DATA (Top 5)</h2>
                    {topUsers.length === 0 ? (
                        <div className="text-red-500">No users found in standard query.</div>
                    ) : (
                        <pre className="bg-zinc-900 p-2 rounded overflow-auto">
                            {JSON.stringify(topUsers, null, 2)}
                        </pre>
                    )}
                </div>

                <div className="border border-zinc-800 p-4 rounded">
                    <h2 className="text-yellow-400 font-bold mb-2">3. SERVICE LAYER OUTPUT</h2>
                    <pre className="bg-zinc-900 p-2 rounded overflow-auto">
                        {JSON.stringify(serviceResult, null, 2)}
                    </pre>
                </div>

                <div className="border border-zinc-800 p-4 rounded">
                    <h2 className="text-purple-400 font-bold mb-2">4. ENVIRONMENT</h2>
                    <div>Node Env: {process.env.NODE_ENV}</div>
                    {/* Security: Do not print full connection string */}
                    <div>DB Provider: Postgres</div>
                </div>
            </div>
        </div>
    );
}
