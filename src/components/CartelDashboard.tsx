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

// Wagmi & Contracts
import { useReadContracts, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import CartelPotABI from '@/lib/abi/CartelPot.json';
import CartelSharesABI from '@/lib/abi/CartelShares.json';

interface CartelDashboardProps {
    address?: string;
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    // --- OFF-CHAIN STATE (DB/Index) ---
    const [rank, setRank] = useState<number | null>(null);
    const [highStakesCount, setHighStakesCount] = useState(0);

    // --- STATE UI (Modals) ---
    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);
    // Removed isInviteModalOpen
    const [isMyClanModalOpen, setIsMyClanModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // --- CONTRACT ADDRESSES ---
    const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
    const POT_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_POT_ADDRESS as `0x${string}`;
    const SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    // --- ON-CHAIN READS ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'balanceOf',
                args: [address, 1n] // 1n = Share ID
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

    const shares = contractData?.[0]?.result ? Number(contractData[0].result) : 0;
    const potBalance = contractData?.[1]?.result ? Number(formatUnits(contractData[1].result as bigint, 6)) : 0;
    const profitAmount = contractData?.[2]?.result ? Number(formatUnits(contractData[2].result as bigint, 6)) : 0;
    const dailyRevenue = contractData?.[3]?.result ? Number(formatUnits(contractData[3].result as bigint, 6)) : 0;
    const totalShares = contractData?.[4]?.result ? Number(contractData[4].result) : 1;

    const sharePercentage = totalShares > 0 ? (shares / totalShares) * 100 : 0;
    const formattedPct = sharePercentage < 0.01 && sharePercentage > 0 ? "<0.01" : sharePercentage.toFixed(2);

    // --- FETCH OFF-CHAIN DATA (Rank, Badges) ---
    useEffect(() => {
        if (address) {
            fetch(`/api/cartel/me/stats?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data.highStakesCount) setHighStakesCount(data.highStakesCount);
                    if (data.rank) setRank(data.rank);
                })
                .catch(err => console.error("Failed to fetch stats:", err));
        }
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

            // Assume success UI
            setTimeout(async () => {
                refetch(); // Refresh data
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

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto">
            {address && <LoginSummary address={address} />}

            <header className="flex justify-between items-center pt-2">
                <div>
                    <h1 className="text-2xl font-black heading-font text-neon-blue">BASE CARTEL</h1>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                    <StatCard className="card-glow border-[#D4AF37]/30 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-zinc-400 font-normal">Your Shares</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-gold-gradient">{shares}</div>
                            <p className="text-xs text-zinc-500 mt-1">🔐 Vault</p>
                        </CardContent>
                    </StatCard>
                </motion.div>
                <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                    <StatCard className="card-glow border-[#4A87FF]/30 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-zinc-400 font-normal">Cartel Pot</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-neon-blue">${potBalance.toLocaleString()}</div>
                            <p className="text-xs text-zinc-500 mt-1">💼 USDC</p>
                        </CardContent>
                    </StatCard>
                </motion.div>
            </div>

            {/* Cartel Earnings (24h) */}
            <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                <StatCard className="card-glow border-[#4FF0E6]/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-zinc-400 font-normal">Cartel Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-[#4FF0E6]">${dailyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500 mt-1">📊 Last 24h</p>
                    </CardContent>
                </StatCard>
            </motion.div>

            {/* Your Cut (Profit Share) */}
            <motion.div variants={fadeUp} whileHover="hover" whileTap="tap">
                <StatCard className="card-glow border-[#3DFF72]/30">
                    <CardHeader>
                        <CardTitle className="text-lg text-white heading-font flex items-center gap-2">
                            💰 Your Cut
                        </CardTitle>
                        <p className="text-xs text-zinc-500">24h Cartel Profits</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Claimable Now</span>
                            <motion.span
                                key={profitAmount}
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 0.4 }}
                                className="text-2xl font-black text-[#3DFF72]"
                            >
                                ${profitAmount.toLocaleString()}
                            </motion.span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Your Empire Share</span>
                            <span className="text-[#D4AF37] font-bold">{formattedPct}%</span>
                        </div>
                        <ClaimButton
                            onClick={handleClaim}
                            disabled={isClaiming || profitAmount === 0}
                        >
                            {isClaiming ? "Claiming..." : "Claim Your Cut"}
                        </ClaimButton>
                    </CardContent>
                </StatCard>
            </motion.div>

            {/* Actions */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold heading-font text-zinc-200">Actions</h2>
                <div className="grid grid-cols-3 gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ActionButton
                            variant="raid"
                            className="h-28 w-full btn-glow border border-red-500/30 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            onClick={async () => {
                                playSound('slash');
                                await haptics.light();
                                setIsRaidModalOpen(true);
                            }}
                        >
                            <span className="text-3xl">⚔️</span>
                            <span className="font-bold heading-font text-sm mt-2">Raid</span>
                        </ActionButton>
                    </motion.div>

                    <motion.div whileHover="hover" whileTap="tap">
                        <ActionButton
                            variant="clan"
                            className="h-28 w-full card-glow hover:border-[#3B82F6]"
                            onClick={async () => {
                                playSound('click');
                                await haptics.light();
                                setIsMyClanModalOpen(true);
                            }}
                        >
                            <span className="text-3xl">🧬</span>
                            <span className="font-bold heading-font text-sm mt-2">My Clan</span>
                        </ActionButton>
                    </motion.div>

                    <motion.div whileHover="hover" whileTap="tap">
                        <ActionButton
                            variant="betray"
                            className="h-28 w-full card-glow hover:border-red-500/50"
                            onClick={async () => {
                                playSound('click');
                                await haptics.warning();
                                setIsBetrayModalOpen(true);
                            }}
                        >
                            <span className="text-3xl">🩸</span>
                            <span className="font-bold heading-font text-sm mt-2">Betray</span>
                        </ActionButton>
                    </motion.div>
                </div>
            </div>

            {/* Auto-Agent */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold heading-font text-zinc-200">Automation</h2>
                <AutoAgentPanel compact={true} />
            </div>

            {/* Most Wanted */}
            <div className="space-y-3">
                <MostWantedBoard />
            </div>

            {/* Cartel News */}
            <div className="space-y-3">
                <NewsBulletin />
            </div>

            {/* Live Activity Feed */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold heading-font text-zinc-200">Activity</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-zinc-500 hover:text-white"
                        onClick={() => setIsHistoryModalOpen(true)}
                    >
                        View History
                    </Button>
                </div>
                <ActivityFeed />
            </div>

            <RaidModal
                isOpen={isRaidModalOpen}
                onClose={() => setIsRaidModalOpen(false)}
                targetName="Random Rival"
            // Ideally this target should come from somewhere
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
        </div>
    );
}
