"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Users, Skull, Bot, Crosshair, Radio } from "lucide-react";

// Components
import RaidModal from "@/components/RaidModal";
import BetrayModal from "@/components/BetrayModal";
import MostWantedList from "./MostWantedList";
import ActivityFeed from "./ActivityFeed";

// Wagmi & Data
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import CartelPotABI from '@/lib/abi/CartelPot.json';
import CartelSharesABI from '@/lib/abi/CartelShares.json';

interface CartelDashboardProps {
    address?: string;
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    // --- STATE ---
    const [revenue24h, setRevenue24h] = useState<number>(0);
    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);

    // --- CONTRACT ADDRESSES ---
    const POT_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_POT_ADDRESS as `0x${string}`;
    const SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    // --- ON-CHAIN READS ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'balanceOf',
                args: address ? [address, 1n] : undefined // Token ID 1
            },
            {
                address: POT_ADDRESS,
                abi: CartelPotABI,
                functionName: 'getBalance',
            }
        ],
        query: {
            enabled: !!address,
            staleTime: 5000
        }
    });

    // Parse Data (Safe Fallbacks)
    const shares = contractData?.[0]?.result ? Number(contractData[0].result) : 0;
    const potBalance = contractData?.[1]?.result ? Number(formatUnits(contractData[1].result as bigint, 6)) : 0;

    // --- OFF-CHAIN READS ---
    const [userRank, setUserRank] = useState<number>(0);

    // --- OFF-CHAIN READS ---
    useEffect(() => {
        // 1. Fetch Revenue
        fetch('/api/cartel/revenue/summary')
            .then(res => res.json())
            .then(data => {
                if (data.success && typeof data.revenue24h === 'number') {
                    setRevenue24h(data.revenue24h);
                }
            })
            .catch(err => console.error("Failed to fetch revenue:", err));

        // 2. Fetch User Summary (Rank)
        if (address) {
            fetch(`/api/cartel/me/summary?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.rank === 'number') {
                        setUserRank(data.rank);
                    }
                })
                .catch(err => console.error("Failed to fetch summary:", err));
        }
    }, [address]);

    const handleRaidClick = () => {
        setIsRaidModalOpen(true);
    };

    const handleModalClose = () => {
        setIsRaidModalOpen(false);
        // Optimistic/Lazy refetch on close to see updated stats
        refetch();
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto pb-32 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#0B0E12]/40 to-[#0B0E12] pointer-events-none blur-3xl opacity-80" />
            <div className="absolute top-[-40px] right-[-40px] text-[10rem] opacity-[0.03] pointer-events-none rotate-12 blur-sm">🎩</div>

            {/* HERO HEADER */}
            <header className="flex flex-col items-center pt-6 pb-4 relative z-10 w-full">
                <div className="relative mb-2">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">🎩</span>
                </div>

                <div className="flex items-center justify-center gap-3 w-full px-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                    <Badge variant="outline" className="bg-[#1A1D26] text-[#D4AF37] border-[#D4AF37]/30 text-[10px] tracking-wider uppercase px-3 py-1 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        Season 1 • Live
                    </Badge>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                </div>

                <h2 className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-3 uppercase opacity-70">Empire Earnings Today</h2>
            </header>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3">

                {/* Shares */}
                <StatCard className="h-full border-[#D4AF37]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-0 pb-1">
                        <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Your Shares</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-black text-white">{shares}</div>
                        <p className="text-[10px] text-zinc-500">
                            {userRank > 0 ? `Global Rank #${userRank}` : 'Unranked'}
                        </p>
                    </CardContent>
                </StatCard>

                {/* Pot */}
                <StatCard className="h-full border-[#3B82F6]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-0 pb-1">
                        <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Cartel Pot</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-black text-white">${potBalance.toLocaleString()}</div>
                        <p className="text-[10px] text-zinc-500">USDC Vault</p>
                    </CardContent>
                </StatCard>

                {/* Revenue */}
                <div className="col-span-2">
                    <StatCard className="border-[#4FF0E6]/20 relative overflow-hidden group flex flex-col justify-between px-4 py-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4FF0E6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide flex items-center gap-1">
                                    Cartel 24h Revenue
                                </div>
                                <div className="text-2xl font-black text-[#4FF0E6]">${revenue24h.toLocaleString()}</div>
                            </div>
                            <div className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">📊</div>
                        </div>
                    </StatCard>
                </div>

                {/* Your Cut (Profit) - Highlighted */}
                <div className="col-span-2">
                    <StatCard className="border-[#3DFF72]/30 bg-gradient-to-b from-[#3DFF72]/5 to-transparent">
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <h3 className="text-xs text-[#3DFF72] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DFF72] animate-pulse" />
                                    Your Cut
                                </h3>
                                <p className="text-[10px] text-zinc-400">Claimable Dividends</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div className="text-xl font-bold text-[#3DFF72]">$0.42</div>
                                <Button size="sm" disabled className="h-7 text-xs bg-[#3DFF72]/20 text-[#3DFF72] border border-[#3DFF72]/50 hover:bg-[#3DFF72]/30">
                                    Claim
                                </Button>
                            </div>
                        </div>
                    </StatCard>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-3 gap-2">
                <Button
                    variant="outline"
                    onClick={handleRaidClick}
                    className="h-24 flex flex-col items-center justify-center gap-2 border-red-500 bg-red-950/30 hover:bg-red-900/50 hover:border-red-400 text-red-400 hover:text-red-300 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] transition-all group active:scale-95"
                >
                    <div className="p-2 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <Sword className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Raid</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 border-blue-500 bg-blue-950/30 hover:bg-blue-900/50 hover:border-blue-400 text-blue-400 hover:text-blue-300 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)] transition-all group active:scale-95"
                    onClick={() => window.location.href = '/clans'}
                >
                    <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Clan</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 border-zinc-600 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-400 text-zinc-300 hover:text-white shadow-lg transition-all group active:scale-95"
                    onClick={() => setIsBetrayModalOpen(true)}
                >
                    <div className="p-2 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                        <Skull className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Betray</span>
                </Button>
            </div>

            {/* AUTO AGENT */}
            <div>
                <StatCard className="border-purple-500/20 bg-[#0F0A1F]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/10">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">Auto-Agent (Beta)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] text-zinc-500">Status</div>
                        <div className="text-[10px] text-purple-300 font-mono bg-purple-500/10 px-2 py-1 rounded">Idle - Waiting for instructions</div>
                    </div>
                </StatCard>
            </div>

            {/* MOST WANTED */}
            <div className="mt-4">
                <MostWantedList />
            </div>

            {/* LIVE ACTIVITY */}
            <div className="mt-4">
                <ActivityFeed />
            </div>

            {/* MODALS */}
            <RaidModal isOpen={isRaidModalOpen} onClose={handleModalClose} />
            <BetrayModal isOpen={isBetrayModalOpen} onClose={() => setIsBetrayModalOpen(false)} />
        </div>
    );
}
