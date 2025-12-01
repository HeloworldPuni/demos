import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { useViewProfile } from "@coinbase/onchainkit/minikit";
import { haptics } from "@/lib/haptics";

interface Player {
    rank: number;
    name: string;
    shares: number;
    yield: number;
    fid?: number;
}

const MOCK_LEADERBOARD: Player[] = [
    { rank: 1, name: "kingpin.eth", shares: 2450, yield: 122, fid: 3621 },
    { rank: 2, name: "shadowboss.base", shares: 1890, yield: 94, fid: 12345 },
    { rank: 3, name: "whale.eth", shares: 1420, yield: 71, fid: 67890 },
    { rank: 4, name: "hustler25", shares: 980, yield: 49 },
    { rank: 5, name: "grinder.base", shares: 750, yield: 37 },
];

export default function Leaderboard() {
    // const viewProfile = useViewProfile();

    const handleViewProfile = async (fid?: number) => {
        if (fid) {
            await haptics.light();
            console.log("View profile:", fid);
            // viewProfile({ fid });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-xl text-white">Cartel Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {MOCK_LEADERBOARD.map((player) => (
                            <div
                                key={player.rank}
                                className={`p-3 rounded-lg border ${player.rank === 1
                                    ? "bg-yellow-900/20 border-yellow-600/30"
                                    : player.rank === 2
                                        ? "bg-gray-500/10 border-gray-500/30"
                                        : player.rank === 3
                                            ? "bg-orange-900/20 border-orange-600/30"
                                            : "bg-zinc-800 border-zinc-700"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="text-2xl">
                                            {player.rank === 1 && "🥇"}
                                            {player.rank === 2 && "🥈"}
                                            {player.rank === 3 && "🥉"}
                                            {player.rank > 3 && `#${player.rank}`}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white">{player.name}</div>
                                            <div className="text-xs text-zinc-400">
                                                {player.shares} shares • {player.yield} USDC/day
                                            </div>
                                        </div>
                                    </div>
                                    {player.fid && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewProfile(player.fid)}
                                            className="text-xs h-7"
                                        >
                                            View Profile
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
