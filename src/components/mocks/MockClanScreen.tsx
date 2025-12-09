"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MockClanScreen() {
    const members = [
        { name: "You", rank: "Capo" },
        { name: "Vito", rank: "Soldier" },
        { name: "Sonny", rank: "Soldier" },
        { name: "Luca", rank: "Associate" },
    ];

    return (
        <div className="min-h-screen bg-black/90 flex items-center justify-center p-4">
            {/* Simulate Modal Open */}
            <motion.div
                initial={{ scale: 0.95, opacity: 1 }}
                className="w-full max-w-sm bg-[#0F131E] border border-blue-900/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]"
            >
                <div className="p-6 text-center border-b border-blue-900/30 bg-blue-950/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="text-4xl mb-2">🧬</div>
                        <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest">
                            CARTEL OMEGA
                        </h2>
                        <div className="flex justify-center gap-4 mt-2 text-xs font-mono text-blue-300/60">
                            <span>MEMBERS: 12/50</span>
                            <span>POWER: 450k</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Invite Code */}
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-2">Invite Code</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl font-mono font-bold text-white tracking-widest">JOIN-402</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-400">
                                📋
                            </Button>
                        </div>
                    </div>

                    {/* Members List */}
                    <div>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Core Members</h3>
                        <div className="space-y-2">
                            {members.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-500">
                                            {m.name[0]}
                                        </div>
                                        <span className={`text-sm font-bold ${i === 0 ? "text-[#3DFF72]" : "text-white"}`}>{m.name}</span>
                                    </div>
                                    <span className="text-[10px] uppercase text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">{m.rank}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-950/10 text-center">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
                        INVITE NEW MEMBERS
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
