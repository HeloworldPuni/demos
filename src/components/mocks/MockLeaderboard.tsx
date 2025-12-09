"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankRow } from "@/components/ui/RankRow";
import { motion } from "framer-motion";
import { fadeUp, staggerList } from "@/components/ui/motionTokens";

// Mock Data
const MOCK_PLAYERS = [
    { rank: 1, name: "Pablo_Escobar", shares: 1250, totalClaimed: 52000, address: "0x1" },
    { rank: 2, name: "El_Chapo", shares: 980, totalClaimed: 34500, address: "0x2" },
    { rank: 3, name: "Scarface", shares: 850, totalClaimed: 28000, address: "0x3" },
    { rank: 4, name: "You", shares: 500, totalClaimed: 12500, address: "0x4" },
    { rank: 5, name: "Griselda", shares: 420, totalClaimed: 8900, address: "0x5" },
    { rank: 6, name: "Tony_S", shares: 350, totalClaimed: 6500, address: "0x6" },
    { rank: 7, name: "Corleone", shares: 300, totalClaimed: 5200, address: "0x7" },
    { rank: 8, name: "Heisenberg", shares: 250, totalClaimed: 3100, address: "0x8" },
    { rank: 9, name: "Capone", shares: 200, totalClaimed: 1200, address: "0x9" },
];

export default function MockLeaderboard() {
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
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerList}
                        className="space-y-2"
                    >
                        {MOCK_PLAYERS.map((player, index) => {
                            const isTopThree = player.rank <= 3;
                            return (
                                <motion.div key={player.rank} variants={fadeUp}>
                                    <RankRow
                                        index={index}
                                        className={`p-3 border transition-all duration-300 ${player.rank === 1
                                            ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/50 glow-gold scale-[1.02]"
                                            : player.rank === 2
                                                ? "bg-gradient-to-r from-zinc-400/20 to-zinc-400/5 border-zinc-400/50"
                                                : player.rank === 3
                                                    ? "bg-gradient-to-r from-orange-600/20 to-orange-600/5 border-orange-600/50"
                                                    : "bg-[#1B1F26] border-zinc-800"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`text-2xl font-black ${player.rank === 1 ? "text-[#D4AF37]" :
                                                    player.rank === 2 ? "text-zinc-300" :
                                                        player.rank === 3 ? "text-orange-500" :
                                                            "text-zinc-500"
                                                    }`}>
                                                    {player.rank === 1 && "👑"}
                                                    {player.rank === 2 && "🥈"}
                                                    {player.rank === 3 && "🥉"}
                                                    {player.rank > 3 && `#${player.rank}`}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`font-bold ${isTopThree ? "text-white" : "text-zinc-300"
                                                            } ${player.name === "You" ? "text-[#3DFF72]" : ""}`}>
                                                            {player.name}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                                                        <span className="text-[#4A87FF]">{player.shares} shares</span>
                                                        <span>•</span>
                                                        <span className="text-[#3DFF72]">${player.totalClaimed.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
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
                </CardContent>
            </Card>
        </div>
    );
}
