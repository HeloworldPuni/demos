import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RaidModal from "./RaidModal";
import BadgesList from "./BadgesList";
import BetrayModal from "./BetrayModal";
import InviteModal from "./InviteModal";
import { haptics } from "@/lib/haptics";
import AutoAgentPanel from "@/components/agent/AutoAgentPanel";

export default function CartelDashboard() {
    const [shares, setShares] = useState(100);
    const [potBalance, setPotBalance] = useState(5432);
    const [yieldAmount, setYieldAmount] = useState(42);
    const [isClaiming, setIsClaiming] = useState(false);

    const handleClaim = async () => {
        await haptics.medium();
        setIsClaiming(true);
        setTimeout(async () => {
            setYieldAmount(0);
            setIsClaiming(false);
            await haptics.success();
        }, 1500);
    };

    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white p-4 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-red-500">Base Cartel</h1>
                <Badge variant="outline" className="border-red-500 text-red-500">Rank: Soldier</Badge>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-400">My Shares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{shares}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-400">Pot Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">${potBalance}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Daily Yield</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Available to Claim</span>
                        <span className="text-xl font-bold text-green-400">${yieldAmount} USDC</span>
                    </div>
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleClaim}
                        disabled={isClaiming || yieldAmount === 0}
                    >
                        {isClaiming ? "Claiming..." : "Claim Yield"}
                    </Button>
                </CardContent>
            </Card>

            <BadgesList />

            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-200">Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="h-24 border-zinc-700 hover:bg-zinc-800 hover:text-red-400 flex flex-col gap-2"
                        onClick={async () => {
                            await haptics.light();
                            setIsRaidModalOpen(true);
                        }}
                    >
                        <span className="text-2xl">⚔️</span>
                        Raid
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 border-zinc-700 hover:bg-zinc-800 hover:text-purple-400 flex flex-col gap-2"
                        onClick={async () => {
                            await haptics.light();
                            setIsInviteModalOpen(true);
                        }}
                    >
                        <span className="text-2xl">🤝</span>
                        Invite
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 border-red-900/30 hover:bg-red-950 hover:text-red-500 flex flex-col gap-2 col-span-2"
                        onClick={async () => {
                            await haptics.warning();
                            setIsBetrayModalOpen(true);
                        }}
                    >
                        <span className="text-2xl">🩸</span>
                        Betray Cartel
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-200">Automation</h2>
                <AutoAgentPanel />
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
        </div>
    );
}
