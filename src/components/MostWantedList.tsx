'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ThreatEntry } from '@/lib/threat-service';
import { Crosshair } from 'lucide-react';

export default function MostWantedList() {
    const [agents, setAgents] = useState<ThreatEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { address } = useAccount();

    useEffect(() => {
        fetch('/api/cartel/most-wanted?limit=5')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAgents(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load most wanted", err);
                setLoading(false);
            });
    }, []);

    const handleRowClick = (agentAddress: string) => {
        router.push(`/profile/${agentAddress}`);
    };

    if (loading) return <div className="p-4 text-center text-zinc-500 text-xs animate-pulse">Scanning surveillance...</div>;
    if (agents.length === 0) return null;

    return (
        <div className="bg-[#111] border border-zinc-800/50 rounded-lg overflow-hidden mt-4">
            <div className="bg-[#1A1A1A] p-3 border-b border-zinc-800 flex justify-between items-center group/header cursor-help" title="Heat Score = (Raids on You * 5) + (Raids by You * 10) + (High Stakes * 20)">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <span>🔥</span> Most Wanted (24h)
                </h3>
                <span className="text-[10px] text-zinc-600 font-mono border-b border-dashed border-zinc-700">HEAT INDEX ⓘ</span>
            </div>

            <div className="divide-y divide-zinc-800/50">
                {agents.map((agent, i) => {
                    const isSelf = address && agent.address.toLowerCase() === address.toLowerCase();
                    const isRaidable = !isSelf;

                    return (
                        <div
                            key={agent.address}
                            onClick={() => handleRowClick(agent.address)}
                            className={`p-3 flex items-center justify-between hover:bg-zinc-900/80 transition-all cursor-pointer group border-l-2 ${isSelf ? 'border-l-blue-500/50 bg-blue-500/5' : 'border-l-transparent hover:border-l-red-500/50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-mono w-4 ${i < 3 ? 'text-white font-bold' : 'text-zinc-600'}`}>
                                    #{i + 1}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors flex items-center gap-2">
                                        {agent.handle ? `@${agent.handle}` : `${agent.address.slice(0, 6)}...`}
                                        {isSelf && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 rounded">YOU</span>}
                                    </span>
                                    <div className="flex gap-2 text-[10px] text-zinc-600">
                                        <span title="Raids Initiated">🔫 {agent.normalRaidsInitiated + agent.highStakesRaidsInitiated}</span>
                                        <span title="Times Targetted">🎯 {agent.timesRaided}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isRaidable && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-red-500/10 p-1 rounded hover:bg-red-500/20 text-red-500" title="Raid Target">
                                            <Crosshair className="w-3 h-3" />
                                        </div>
                                    </div>
                                )}
                                <div className="text-right">
                                    <div className="text-sm font-black text-red-500/90 font-mono">
                                        {agent.threatScore}
                                    </div>
                                    <div className="text-[9px] text-zinc-600 uppercase tracking-wide">
                                        Heat
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-2 bg-zinc-950/30 text-center border-t border-zinc-800/30 text-[9px] text-zinc-600 italic">
                Higher heat = Higher priority target
            </div>
        </div>
    );
}
