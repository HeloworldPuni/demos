import { getCartelTitle } from './cartel-titles';

export interface LeaderboardEntry {
    rank: number;
    address: string;
    name: string;
    shares: number;
    totalClaimed: number;
    raidCount: number;
    fid?: number;
    lastActive: string;
    title?: string;
}

import prisma from './prisma';

export async function getLeaderboard(limit: number = 20, page: number = 1): Promise<{ entries: LeaderboardEntry[], total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            orderBy: { shares: 'desc' },
            take: limit,
            skip: skip,
        }),
        prisma.user.count()
    ]);

    // Let's get raid counts for these top users
    const addresses = users.map(u => u.walletAddress);

    let raidCounts: Record<string, number> = {};

    if (addresses.length > 0) {
        const events = await prisma.cartelEvent.groupBy({
            by: ['attacker'],
            where: {
                attacker: { in: addresses },
                type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
            },
            _count: {
                id: true
            }
        });

        events.forEach(ev => {
            if (ev.attacker) raidCounts[ev.attacker] = ev._count.id;
        });
    }

    const entries = users.map((u, i) => ({
        rank: skip + i + 1,
        address: u.walletAddress,
        name: u.walletAddress,
        shares: u.shares || 0,
        totalClaimed: u.referralRewardsClaimed || 0,
        raidCount: raidCounts[u.walletAddress] || 0,
        fid: u.farcasterId ? parseInt(u.farcasterId) : undefined,
        lastActive: u.lastSeenAt?.toISOString() || u.createdAt.toISOString(),
        title: getCartelTitle(skip + i + 1, u.shares || 0)
    }));

    return { entries, total };
}

export function generateLeaderboardPost(entries: LeaderboardEntry[]): string {
    if (entries.length === 0) return "No data available.";

    const topPlayer = entries[0];
    const runnersUp = entries.slice(1, 4).map(p => p.name.startsWith("0x") ? `${p.name.slice(0, 6)}...` : `@${p.name}`).join(", ");

    // Option B style (Highlight #1)
    return `👑 **New Cartel Boss Today:**\n` +
        `${topPlayer.name.startsWith("0x") ? topPlayer.name.slice(0, 6) : "@" + topPlayer.name} with ${topPlayer.shares.toLocaleString()} shares on Base.\n\n` +
        `Runners up: ${runnersUp}...\n` +
        `Full board: basecartel.in`;
}
