import prisma from '@/lib/prisma';

export interface ThreatEntry {
    rank: number;
    address: string;
    handle?: string;
    threatScore: number;
    normalRaidsInitiated: number;
    highStakesRaidsInitiated: number;
    timesRaided: number;
}

interface PlayerStats {
    normalRaidsInitiated: number;
    highStakesRaidsInitiated: number;
    timesRaided: number;
}

export async function getMostWanted(limit: number = 10, windowHours: number = 24): Promise<ThreatEntry[]> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    // 1. Fetch recent events
    const events = await prisma.cartelEvent.findMany({
        where: {
            timestamp: { gte: since },
            type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
        },
        select: {
            type: true,
            attacker: true,
            target: true
        }
    });

    // 2. Aggregate stats
    const stats: Record<string, PlayerStats> = {};

    const initStats = (): PlayerStats => ({
        normalRaidsInitiated: 0,
        highStakesRaidsInitiated: 0,
        timesRaided: 0
    });

    for (const ev of events) {
        if (!ev.attacker || !ev.target) continue;

        // Attacker stats
        if (!stats[ev.attacker]) stats[ev.attacker] = initStats();
        if (ev.type === 'RAID') {
            stats[ev.attacker].normalRaidsInitiated++;
        } else if (ev.type === 'HIGH_STAKES_RAID') {
            stats[ev.attacker].highStakesRaidsInitiated++;
        }

        // Target stats
        if (!stats[ev.target]) stats[ev.target] = initStats();
        stats[ev.target].timesRaided++;
    }

    // 3. Compute Scores
    let results = Object.entries(stats).map(([address, s]) => {
        const threatScore =
            (s.normalRaidsInitiated * 10) +
            (s.highStakesRaidsInitiated * 20) +
            (s.timesRaided * 5);

        return {
            address,
            ...s,
            threatScore
        };
    });

    // 4. Sort
    results.sort((a, b) => b.threatScore - a.threatScore);

    // 5. Limit
    results = results.slice(0, limit);

    // 6. Enrich with Handles (if available in User table)
    // We get all addresses and query User table
    const addresses = results.map(r => r.address);
    const users = await prisma.user.findMany({
        where: { walletAddress: { in: addresses } },
        select: { walletAddress: true, farcasterId: true } // Assuming we store handle in farcasterId or similar, or just ID
    });

    const userMap = new Map(users.map(u => [u.walletAddress, u.farcasterId]));

    return results.map((r, index) => ({
        rank: index + 1,
        ...r,
        handle: userMap.get(r.address) || undefined
    }));
}

export async function getThreatStats(targetAddress: string): Promise<ThreatEntry | null> {
    // For now, we compute the whole list to find the rank.
    // Optimization: In future, use a cached leaderboard or SQL view.
    const list = await getMostWanted(100, 24); // Checking top 100 for rank
    const found = list.find(e => e.address.toLowerCase() === targetAddress.toLowerCase());

    if (found) return found;

    // If not in top 100, calculate raw stats without rank (or rank > 100)
    // We do a quick directed query for this specific user
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Attacker Events
    const attacks = await prisma.cartelEvent.groupBy({
        by: ['type'],
        where: {
            attacker: targetAddress,
            timestamp: { gte: since },
            type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
        },
        _count: true
    });

    // Victim Events
    const victimCount = await prisma.cartelEvent.count({
        where: {
            target: targetAddress,
            timestamp: { gte: since },
            type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
        }
    });

    let normal = 0;
    let high = 0;

    attacks.forEach(a => {
        if (a.type === 'RAID') normal = a._count;
        if (a.type === 'HIGH_STAKES_RAID') high = a._count;
    });

    const threatScore = (normal * 10) + (high * 20) + (victimCount * 5);

    return {
        rank: 999, // Unranked / >100
        address: targetAddress,
        threatScore,
        normalRaidsInitiated: normal,
        highStakesRaidsInitiated: high,
        timesRaided: victimCount
    };
}
