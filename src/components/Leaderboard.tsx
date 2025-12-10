"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankRow } from "@/components/ui/RankRow";
import { haptics } from "@/lib/haptics";
import { getCartelTitle, getTitleTheme } from "@/lib/cartel-titles";
import MyClanModal from "./MyClanModal";
import { SFX, playSound } from "@/lib/audio";
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { fadeUp, staggerList, shimmer } from "@/components/ui/motionTokens";

interface Player {
    rank: number;
    name: string;
    shares: number;
    totalClaimed: number;
    fid?: number;
    address: string;
}

export default function Leaderboard() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchLeaderboard = async (pageNum: number, isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            const res = await fetch(`/api/cartel/leaderboard?page=${pageNum}&limit=10`);
            const data = await res.json();

            if (data.data) {
                if (isLoadMore) {
                    setPlayers(prev => [...prev, ...data.data]);
                } else {
                    setPlayers(data.data);
                }

                // Check if we reached the end or max limit (100)
                const currentTotal = isLoadMore ? players.length + data.data.length : data.data.length;
                if (currentTotal >= data.totalPlayers || currentTotal >= 100 || data.data.length === 0) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchLeaderboard(nextPage, true);
        playSound('click');
        haptics.light();
    };

    const handleViewProfile = async (address?: string) => {
        if (address) {
            playSound('click');
            await haptics.light();
            setSelectedPlayer(address);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 pb-24 max-w-[400px] mx-auto">
            <Card className="card-glow border-[#4A87FF]/30">
                <CardHeader className="pb-4">
                    <div className="text-center">
                        <CardTitle className="text-2xl heading-font text-neon-blue mb-1">
                            🏆 Cartel Rankings
                        </CardTitle>
                        <p className="text-sm text-[#D4AF37]">Season 1</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-zinc-900 rounded-lg"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerList}
                                className="space-y-2"
                            >
                                {players.map((player, index) => {
                                    const title = getCartelTitle(player.rank, player.shares);
                                    const theme = getTitleTheme(title);
                                    const isTopThree = player.rank <= 3;
                                    const isTopTen = player.rank <= 10;

                                    return (
                                        <motion.div
                                            key={`${player.rank}-${player.address}`}
                                            variants={fadeUp}
                                        >
                                            <RankRow
                                                index={index}
                                                className={`p-3 border transition-all duration-300 ${player.rank === 1
                                                    ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/50 glow-gold scale-[1.02]"
                                                    : player.rank === 2
                                                        ? "bg-gradient-to-r from-zinc-400/20 to-zinc-400/5 border-zinc-400/50"
                                                        : player.rank === 3
                                                            ? "bg-gradient-to-r from-orange-600/20 to-orange-600/5 border-orange-600/50"
                                                            : isTopTen
                                                                ? "bg-[#1B1F26] border-[#4A87FF]/20"
                                                                : "bg-[#1B1F26] border-zinc-800"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className={`text-2xl font-black ${player.rank === 1 ? "text-[#D4AF37]" :
                                                            player.rank === 2 ? "text-zinc-300" :
                                                                player.rank === 3 ? "text-orange-500" :
                                                                    "text-zinc-500"
                                                            }`}>
                                                            {player.rank === 1 && (
                                                                <motion.div
                                                                    animate={{ opacity: [1, 0.6, 1] }}
                                                                    transition={{ duration: 2, repeat: Infinity }}
                                                                    className="inline-block"
                                                                >
                                                                    👑
                                                                </motion.div>
                                                            )}
                                                            {player.rank === 2 && "🥈"}
                                                            {player.rank === 3 && "🥉"}
                                                            {player.rank > 3 && `#${player.rank}`}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className={`font-bold truncate ${isTopThree ? "text-white" : "text-zinc-300"
                                                                    }`}>
                                                                    {player.name}
                                                                </div>
                                                                {/* Title Badge */}
                                                                <div className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${theme.color} bg-black/30 flex items-center gap-1 whitespace-nowrap`}>
                                                                    <span>{theme.icon}</span>
                                                                    <span className="uppercase tracking-wider font-bold">{title}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                                                                <span className="text-[#4A87FF]">{player.shares} shares</span>
                                                                <span>•</span>
                                                                <span className="text-[#3DFF72]">${player.totalClaimed.toLocaleString()} claimed</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewProfile(player.address)}
                                                        className="text-xs h-7 border-[#4A87FF]/30 hover:border-[#4A87FF] hover:bg-[#4A87FF]/10 text-[#4A87FF]"
                                                    >
                                                        View
                                                    </Button>

                                                </div>
                                            </RankRow>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {hasMore && (
                                <div className="mt-4 text-center">
                                    <Button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        variant="ghost"
                                        className="text-[#4A87FF] hover:text-[#4A87FF]/80 hover:bg-[#4A87FF]/10 w-full border border-dashed border-[#4A87FF]/30"
                                    >
                                        {loadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            "Load More Agents (Next 10)"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="mt-6 p-4 bg-[#4A87FF]/5 border border-[#4A87FF]/20 rounded-lg text-center">
                        <p className="text-sm text-zinc-400">
                            Top 100 players earn <span className="text-[#D4AF37] font-bold">exclusive badges</span> at season end
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Modal */}
            {selectedPlayer && (
                <MyClanModal
                    isOpen={!!selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    address={selectedPlayer}
                />
            )}
        </div>
    );
}
