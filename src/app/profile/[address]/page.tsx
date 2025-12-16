"use client";

import { useEffect, useState, use } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";
import RaidModal from "@/components/RaidModal";
import { ThreatEntry } from '@/lib/threat-service';

// Icons
import { Sword, Shield, Crosshair, AlertTriangle } from 'lucide-react';

interface PublicProfileProps {
    params: Promise<{ address: string }> | { address: string };
}

export default function PublicProfilePage({ params }: PublicProfileProps) {
    // 1. Unwrapping Params (Safe for Next 13-15)
    const [targetAddress, setTargetAddress] = useState<string>("");
    const [stats, setStats] = useState<ThreatEntry | null>(null);
    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addLog = (msg: string) => setDebugLog(prev => [...prev.slice(-4), msg]);

    useEffect(() => {
        // Handle params whether promise or object
        Promise.resolve(params).then((p) => {
            if (p && p.address) {
                setTargetAddress(p.address);
                addLog(`Params Resolved: ${p.address}`);
                fetchStats(p.address);
            }
        }).catch(e => {
            console.error("Params Error", e);
            addLog(`Params Error: ${e.message}`);
        });
    }, [params]);

    const fetchStats = async (addr: string) => {
        try {
            addLog(`Fetching stats for ${addr}...`);
            const res = await fetch(`/api/cartel/profile/stats?address=${addr}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
                addLog(`Stats Loaded: Threat ${data.data.threatScore}`);
            } else {
                addLog(`Stats Failed: ${data.error}`);
            }
        } catch (e: any) {
            console.error("Failed to fetch stats", e);
            addLog(`Fetch Error: ${e.message}`);
        }
    }

    // 2. Viewer Address
    const { address: viewerAddress } = useAccount();

    // Defensive Check for Self
    const isSelf = Boolean(
        viewerAddress &&
        targetAddress &&
        typeof viewerAddress === 'string' &&
        typeof targetAddress === 'string' &&
        viewerAddress.toLowerCase() === targetAddress.toLowerCase()
    );

    // 3. Resolve Identity
    const { data: ensName } = useEnsName({ address: targetAddress as `0x${string}`, chainId: 8453 });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined, chainId: 8453 });

    // Mock Display Name
    const displayName = ensName || (targetAddress ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : "Unknown");

    if (!targetAddress) return <div className="p-10 text-center text-zinc-500">Loading Subject...</div>;

    return (
        <AppLayout>
            <motion.div {...motionPage}>
                <header className="pt-2 mb-6">
                    <h1 className="text-2xl font-black heading-font text-zinc-500 uppercase">
                        {isSelf ? "MY FILE" : "SURVEILLANCE"}
                    </h1>
                    <p className="text-sm text-zinc-400 font-mono text-[10px]">
                        SUBJECT: {targetAddress}
                    </p>
                </header>

                {/* Identity Card */}
                <Card className="card-glow border-zinc-700 mb-6">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex flex-row items-center gap-4 w-full">
                            {/* Avatar */}
                            <div className={`p-1 border-2 ${isSelf ? 'border-blue-500' : 'border-red-500'} rounded-full shrink-0`}>
                                {ensAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={ensAvatar}
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-16 h-16 rounded-full ${isSelf ? 'bg-blue-900/20' : 'bg-red-900/20'} flex items-center justify-center`}>
                                        <span className="text-2xl">
                                            {isSelf ? '👤' : '🎯'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col min-w-0">
                                <div className="font-bold text-lg heading-font text-white truncate flex items-center gap-2">
                                    {displayName}
                                    {isSelf && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">YOU</span>}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                    Base Network
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                {!isSelf && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20"
                            onClick={() => setIsRaidModalOpen(true)}
                        >
                            <Crosshair className="w-4 h-4 mr-2" />
                            Raid Target
                        </Button>
                        <Button
                            variant="outline"
                            className="text-zinc-400 border-zinc-700"
                            onClick={() => {
                                navigator.clipboard.writeText(targetAddress);
                            }}
                        >
                            Copy Address
                        </Button>
                    </div>
                )}

                {/* Real Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Heat (24h)</div>
                        <div className="text-xl font-black text-red-500">
                            {stats ? stats.threatScore : (
                                <span className="animate-pulse text-zinc-700">...</span>
                            )}
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Rank</div>
                        <div className="text-xl font-black text-zinc-300">
                            {stats ? (stats.rank < 100 ? `#${stats.rank}` : ">100") : (
                                <span className="animate-pulse text-zinc-700">...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* DEBUG CONSOLE (Requested by User) */}
                <div className="mt-8 p-4 bg-black border border-red-900/50 font-mono text-[10px] text-red-500/80 rounded">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-900/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-bold">SYSTEM DIAGNOSTICS</span>
                    </div>
                    <div className="space-y-1">
                        {debugLog.map((log, i) => (
                            <div key={i}>{`> ${log}`}</div>
                        ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-900/30 opacity-50">
                        RAW DATA: {JSON.stringify(stats || "No Data", null, 0)}
                    </div>
                </div>

                <RaidModal
                    isOpen={isRaidModalOpen}
                    onClose={() => setIsRaidModalOpen(false)}
                    targetAddress={targetAddress}
                    targetName={displayName || "Target"}
                />

            </motion.div>
        </AppLayout>
    );
}
