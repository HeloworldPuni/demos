import { useState, useEffect } from 'react';
import { BossBadge } from "@/components/ui/BossBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ClaimButton } from "@/components/ui/ClaimButton";
import { ActionButton } from "@/components/ui/ActionButton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RaidModal from "./RaidModal";
import BadgesList from "./BadgesList";
import BetrayModal from "./BetrayModal";
import InviteModal from "./InviteModal";
import { haptics } from "@/lib/haptics";
import AutoAgentPanel from "@/components/agent/AutoAgentPanel";
import ActivityFeed from "./ActivityFeed";
import MostWantedBoard from "./MostWantedBoard";
import NewsBulletin from "./NewsBulletin";
import LoginSummary from "./LoginSummary";
import { getCartelTitle } from "@/lib/cartel-titles";
import MyClanModal from "./MyClanModal";
import RaidHistoryModal from "./RaidHistoryModal";

interface CartelDashboardProps {
    address?: string;
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    const [shares, setShares] = useState(100);
    const [rank, setRank] = useState<number | null>(null);
    const [potBalance] = useState(5432);
    const [profitAmount, setProfitAmount] = useState(42);
    const [dailyRevenue] = useState(180);
    const [sharePercentage] = useState(2.5);
    const [isClaiming, setIsClaiming] = useState(false);
    const [highStakesCount, setHighStakesCount] = useState(0);

    useEffect(() => {
        if (address) {
            fetch(`/api/cartel/me/stats?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data.highStakesCount) setHighStakesCount(data.highStakesCount);
                    if (data.shares) setShares(data.shares);
                    if (data.rank) setRank(data.rank);
                })
                .catch(err => console.error("Failed to fetch stats:", err));
        }
    }, [address]);

    const getRiskBadge = () => {
        if (highStakesCount >= 10) return "🔥 High-Stakes Addict";
        if (highStakesCount >= 3) return "🔥 Risk Lover";
        if (highStakesCount >= 1) return "🔥 Tried High-Stakes";
        return null;
    };

    const riskBadge = getRiskBadge();
    const cartelTitle = getCartelTitle(rank, shares);

    const handleClaim = async () => {
        await haptics.medium();
        setIsClaiming(true);
        setTimeout(async () => {
            setProfitAmount(0);
            setIsClaiming(false);
            await haptics.success();
        }, 1500);
    };

    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isMyClanModalOpen, setIsMyClanModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
                <StatCard className="card-glow border-[#D4AF37]/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-zinc-400 font-normal">Your Shares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-gold-gradient">{shares}</div>
                        <p className="text-xs text-zinc-500 mt-1">🔐 Vault</p>
                    </CardContent>
                </StatCard>
                <StatCard className="card-glow border-[#4A87FF]/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-zinc-400 font-normal">Cartel Pot</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-neon-blue">${potBalance}</div>
                        <p className="text-xs text-zinc-500 mt-1">💼 USDC</p>
                    </CardContent>
                </StatCard>
            </div>

            {/* Cartel Earnings (24h) */}
            <StatCard className="card-glow border-[#4FF0E6]/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-zinc-400 font-normal">Cartel Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-[#4FF0E6]">${dailyRevenue}</div>
                    <p className="text-xs text-zinc-500 mt-1">📊 Last 24h</p>
                </CardContent>
            </StatCard>

            {/* Your Cut (Profit Share) */}
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
                        <span className="text-2xl font-black text-[#3DFF72]">${profitAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Your Empire Share</span>
                        <span className="text-[#D4AF37] font-bold">{sharePercentage}%</span>
                    </div>
                    <ClaimButton
                        onClick={handleClaim}
                        disabled={isClaiming || profitAmount === 0}
                    >
                        {isClaiming ? "Claiming..." : "Claim Your Cut"}
                    </ClaimButton>
                </CardContent>
            </StatCard>

            <BadgesList />

            {/* Actions */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold heading-font text-zinc-200">Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <ActionButton
                        variant="raid"
                        className="h-28"
                        onClick={async () => {
                            await haptics.light();
                            setIsRaidModalOpen(true);
                        }}
                    >
                        <span className="text-3xl">⚔️</span>
                        <span className="font-bold heading-font">Raid</span>
                    </ActionButton>

                    <ActionButton
                        variant="clan"
                        className="h-28"
                        onClick={async () => {
                            await haptics.light();
                            setIsMyClanModalOpen(true);
                        }}
                    >
                        <span className="text-3xl">🧬</span>
                        <span className="font-bold heading-font">My Clan</span>
                    </ActionButton>

                    <Link href="/invites" className="w-full" onClick={async () => await haptics.light()}>
                        <ActionButton
                            variant="invite"
                            className="w-full h-28"
                        >
                            <span className="text-3xl">🤝</span>
                            <span className="font-bold heading-font">Invite</span>
                        </ActionButton>
                    </Link>

                    <ActionButton
                        variant="betray"
                        className="h-28"
                        onClick={async () => {
                            await haptics.warning();
                            setIsBetrayModalOpen(true);
                        }}
                    >
                        <span className="text-3xl">🩸</span>
                        <span className="font-bold heading-font">Betray</span>
                    </ActionButton>
                </div>
            </div>

            {/* Auto-Agent */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold heading-font text-zinc-200">Automation</h2>
                <AutoAgentPanel />
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
            />

            <BetrayModal
                isOpen={isBetrayModalOpen}
                onClose={() => setIsBetrayModalOpen(false)}
            />

            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
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
