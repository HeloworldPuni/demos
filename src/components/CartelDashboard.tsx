"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleHover, scaleTap } from "@/components/ui/motionTokens";
import { BossBadge } from "@/components/ui/BossBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ClaimButton } from "@/components/ui/ClaimButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { SFX, playSound } from "@/lib/audio";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RaidModal from "./RaidModal";
import FaucetButton from "./FaucetButton";
import BadgesList from "./BadgesList";
import BetrayModal from "./BetrayModal";
import { haptics } from "@/lib/haptics";
import AutoAgentPanel from "@/components/agent/AutoAgentPanel";
import ActivityFeed from "./ActivityFeed";
import MostWantedBoard from "./MostWantedBoard";
import NewsBulletin from "./NewsBulletin";
import LoginSummary from "./LoginSummary";
import { getCartelTitle } from "@/lib/cartel-titles";
import MyClanModal from "./MyClanModal";
import RaidHistoryModal from "./RaidHistoryModal";
import SaveAppButton from "@/components/SaveAppButton";

// Wagmi & Contracts
import { useReadContracts, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import CartelPotABI from '@/lib/abi/CartelPot.json';
import CartelSharesABI from '@/lib/abi/CartelShares.json';
import { MOCK_USER } from '@/lib/dev-config';

interface CartelDashboardProps {
    address?: string;
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    // --- OFF-CHAIN STATE (DB/Index) ---
    const [rank, setRank] = useState<number | null>(null);
    const [highStakesCount, setHighStakesCount] = useState(0);
    const [offChainRevenue, setOffChainRevenue] = useState<number | null>(null);
    const [showRevenueChart, setShowRevenueChart] = useState(false);


    // --- STATE UI (Modals) ---
    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);
    const [isMyClanModalOpen, setIsMyClanModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // --- CONTRACT ADDRESSES ---
    const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
    const POT_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_POT_ADDRESS as `0x${string}`;
    const SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    // --- ON-CHAIN READS ---
    const { data: contractData, refetch, error: contractError } = useReadContracts({
        contracts: [
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'balanceOf',
                args: [address, 1n]
            },
            {
                address: POT_ADDRESS,
                abi: CartelPotABI,
                functionName: 'getBalance',
            },
            {
                address: CORE_ADDRESS,
                abi: CartelCoreABI,
                functionName: 'getPendingProfit',
                args: [address]
            },
            {
                address: CORE_ADDRESS,
                abi: CartelCoreABI,
                functionName: 'dailyRevenuePool',
            },
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'totalSupply',
                args: [1n]
            }
        ]
    });

    useEffect(() => {
        if (contractError) {
            console.error("Dashboard Contract Read Error:", contractError);
        }
    }, [contractError]);

    const isDevMode = false; // Forced to false for production readiness

    const realShares = contractData?.[0]?.result ? Number(contractData[0].result) : 0;
    const realPotBalance = contractData?.[1]?.result ? Number(formatUnits(contractData[1].result as bigint, 6)) : 0;
    const realProfitAmount = contractData?.[2]?.result ? Number(formatUnits(contractData[2].result as bigint, 6)) : 0;
    const realDailyRevenue = contractData?.[3]?.result ? Number(formatUnits(contractData[3].result as bigint, 6)) : 0;
    const realTotalShares = contractData?.[4]?.result ? Number(contractData[4].result) : 1;

    const shares = realShares;
    const potBalance = realPotBalance;
    const profitAmount = realProfitAmount;
    const dailyRevenue = offChainRevenue !== null ? (offChainRevenue / 1000000) : realDailyRevenue;
    const totalShares = realTotalShares;

    const sharePercentage = totalShares > 0 ? (shares / totalShares) * 100 : 0;
    const formattedPct = sharePercentage < 0.01 && sharePercentage > 0 ? "<0.01" : sharePercentage.toFixed(2);

    // --- FETCH OFF-CHAIN DATA (Rank, Badges, Global Revenue) ---
    useEffect(() => {
        // 1. User Stats
        if (address) {
            fetch(`/api/cartel/me/stats?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data.highStakesCount) setHighStakesCount(data.highStakesCount);
                    if (data.rank) setRank(data.rank);
                })
                .catch(err => console.error("Failed to fetch stats:", err));
        }

        // 2. Global Revenue (V1 System)
        fetch('/api/cartel/revenue/summary')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.revenue24h !== undefined) {
                    // New API returns pre-summed human float, no division needed
                    setOffChainRevenue(data.revenue24h * 1000000); // Hack: Component divides by 1M later, so multiply here to keep logic compatible
                }
            })
            .catch(err => console.error("Failed to fetch revenue summary:", err));
    }, [address]);

    const { writeContractAsync } = useWriteContract();

    // --- CLAIM ACTION ---
    const handleClaim = async () => {

        await haptics.medium();
        if (profitAmount > 0) playSound('coin');
        setIsClaiming(true);

        try {
            const hash = await writeContractAsync({
                address: CORE_ADDRESS,
                abi: CartelCoreABI,
                functionName: 'claimProfit',
                args: []
            });
            console.log("Claim Tx:", hash);

            setTimeout(async () => {
                refetch();
                setIsClaiming(false);
                await haptics.success();
            }, 5000);

        } catch (e) {
            console.error("Claim Failed:", e);
            playSound('error');
            setIsClaiming(false);
        }
    };

    const cartelTitle = getCartelTitle(rank, shares);

    // Custom Stagger
    const stagger = {
        animate: { transition: { staggerChildren: 0.08 } }
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto pb-24 relative overflow-hidden"
        >
            {/* Background Elements (Restored & Blended) */}
            {/* Background Elements (Restored & Blended) */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#0B0E12]/40 to-[#0B0E12] pointer-events-none blur-3xl opacity-80" />
            <div className="absolute top-[-40px] right-[-40px] text-[10rem] opacity-[0.03] pointer-events-none rotate-12 blur-sm">🎩</div>

            {/* HERO HEADER */}
            <motion.header variants={fadeUp} className="flex flex-col items-center pt-6 pb-4 relative z-10 w-full">
                <div className="relative mb-2">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">🎩</span>
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full"
                    />
                </div>

                <div className="flex items-center justify-center gap-3 w-full px-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                    <Badge variant="outline" className="bg-[#1A1D26] text-[#D4AF37] border-[#D4AF37]/30 text-[10px] tracking-wider uppercase px-3 py-1 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        Season 1 • Live
                    </Badge>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                </div>

                <h2 className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-3 uppercase opacity-70">Empire Earnings Today</h2>
            </motion.header>

            {/* STATS GRID (Compact) */}
            <motion.div variants={stagger} className="grid grid-cols-2 gap-3">

                {/* Shares */}
                <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                    <StatCard className="h-full border-[#D4AF37]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Your Shares</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition-colors">{shares}</div>
                            <p className="text-[10px] text-zinc-500">Global Rank #{rank || '-'}</p>
                        </CardContent>
                    </StatCard>
                </motion.div>

                {/* Pot */}
                <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                    <StatCard className="h-full border-[#3B82F6]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Cartel Pot</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-black text-white group-hover:text-[#3B82F6] transition-colors">${potBalance.toLocaleString()}</div>
                            <p className="text-[10px] text-zinc-500">USDC Vault</p>
                        </CardContent>
                    </StatCard>
                </motion.div>

                {/* Earnings */}
                <motion.div variants={fadeUp} whileHover="hover" whileTap="tap" className="col-span-2">
                    <div
                        onClick={() => setShowRevenueChart(!showRevenueChart)}
                        className="cursor-pointer"
                    >
                        <StatCard className={`border-[#4FF0E6]/20 relative overflow-hidden group flex flex-col justify-between px-4 py-3 transition-all duration-300 ${showRevenueChart ? 'h-auto ring-1 ring-[#4FF0E6]/50 bg-zinc-900/80' : ''}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4FF0E6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide flex items-center gap-1">
                                        Cartel 24h Revenue
                                        <span className={`transition-transform duration-300 ${showRevenueChart ? 'rotate-180 text-[#4FF0E6]' : ''}`}>▼</span>
                                    </div>
                                    <div className="text-2xl font-black text-[#4FF0E6]">${dailyRevenue.toLocaleString()}</div>
                                </div>
                                <div className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">📊</div>
                            </div>

                            {/* Chart Expand Area - No Motion (Stability Fix) */}
                            {showRevenueChart && (
                                <div
                                    className="w-full pt-4 border-t border-zinc-800/50 mt-3 animate-in fade-in duration-300"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <RevenueChart />
                                </div>
                            )}
                        </StatCard>
                    </div>
                </motion.div>

                {/* Your Cut (Profit) - Highlighted */}
                <motion.div variants={fadeUp} className="col-span-2">
                    <StatCard className="border-[#3DFF72]/30 bg-gradient-to-b from-[#3DFF72]/5 to-transparent">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xs text-[#3DFF72] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DFF72] animate-pulse" />
                                    Your Cut
                                </h3>
                                <p className="text-[10px] text-zinc-400">Claimable Dividends</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <motion.div
                                key={profitAmount}
                                animate={{ scale: [1, 1.05, 1] }}
                                className="text-4xl font-black text-white tracking-tight"
                            >
                                <span className="text-[#3DFF72]">$</span>{profitAmount.toLocaleString()}
                            </motion.div>
                            <ClaimButton
                                onClick={handleClaim}
                                disabled={isClaiming || profitAmount === 0}
                                className="h-9 min-w-[100px] px-4 text-xs font-bold bg-[#3DFF72] hover:bg-[#3DFF72]/90 text-black shadow-[0_0_15px_rgba(61,255,114,0.4)] transition-all"
                            >
                                {isClaiming ? "CLAIMING..." : "CLAIM"}
                            </ClaimButton>
                        </div>
                    </StatCard>
                </motion.div>
            </motion.div>

            {/* SAVE APP PROMPT (If inside MiniApp) */}
            <div className="flex flex-col gap-2 justify-center mt-2 mb-2 items-center">
                <FaucetButton />
                <SaveAppButton variant="outline" className="w-full border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-white/50" />
            </div>

            {/* ACTION BUTTONS */}
            <motion.div variants={stagger} className="grid grid-cols-3 gap-3">

                {/* Raid */}
                <motion.button
                    variants={fadeUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        playSound('slash');
                        haptics.light();
                        setIsRaidModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#1A1111] border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:border-red-500 transition-all group"
                >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">⚔️</span>
                    <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Raid</span>
                </motion.button>

                {/* My Clan */}
                <motion.button
                    variants={fadeUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        playSound('click');
                        haptics.light();
                        setIsMyClanModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#0F131E] border border-[#3B82F6]/30 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:border-[#3B82F6] transition-all group"
                >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🧬</span>
                    <span className="text-[10px] font-bold text-[#3B82F6] tracking-wider uppercase">Clan</span>
                </motion.button>

                {/* Betray */}
                <motion.button
                    variants={fadeUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        playSound('click');
                        haptics.warning();
                        setIsBetrayModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#160B0B] border border-red-900/30 hover:border-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all group"
                >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🩸</span>
                    <span className="text-[10px] font-bold text-red-700 group-hover:text-red-500 tracking-wider uppercase">Betray</span>
                </motion.button>

            </motion.div>

            {/* ACTIVITY FEED */}
            <motion.div variants={fadeUp} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Wire</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-zinc-600 hover:text-white"
                        onClick={() => setIsHistoryModalOpen(true)}
                    >
                        VIEW ALL
                    </Button>
                </div>
                <ActivityFeed />
            </motion.div>

            {/* Automation (Bottom) */}
            <motion.div variants={fadeUp}>
                <AutoAgentPanel compact={true} />
            </motion.div>

            {/* Modals */}
            <RaidModal
                isOpen={isRaidModalOpen}
                onClose={() => setIsRaidModalOpen(false)}
                targetName="Random Rival"
            />
            <BetrayModal
                isOpen={isBetrayModalOpen}
                onClose={() => setIsBetrayModalOpen(false)}
            />
            <MyClanModal
                isOpen={isMyClanModalOpen}
                onClose={() => setIsMyClanModalOpen(false)}
                address={address || ""}
            />
            <RaidHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                address={address || ""}
            />
        </motion.div>
    );
}
