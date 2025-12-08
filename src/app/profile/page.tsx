"use client";

import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AutoAgentPanel from "@/components/agent/AutoAgentPanel";
import ReferralModal from "@/components/ReferralModal";
import { useState, useEffect } from 'react';
import { ClanSummary } from '@/lib/clan-service';

import { useFrameContext } from "@/components/providers/FrameProvider";

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    // Resolve Onchain Identity (Basenames/ENS)
    // We manually fetch this to guarantee we have the string to render
    const { data: ensName } = useEnsName({ address, chainId: 8453 });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [referralStats, setReferralStats] = useState<ClanSummary | null>(null);

    // Get Farcaster Context
    const { context } = useFrameContext();
    const user = context?.user;

    // Determine Display Data (Priority: Farcaster -> ENS -> Address)
    const displayName = user?.username ? `@${user.username}` : (ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown Member'));
    const displayAvatar = user?.pfpUrl || ensAvatar;
    const displaySubtext = user?.fid ? `FID: ${user.fid}` : (ensName ? address : '');

    useEffect(() => {
        if (address) {
            fetch(`/api/cartel/invites/me?address=${address}`)
                .then(res => res.json())
                .then(data => setReferralStats(data))
                .catch(err => console.error(err));
        }
    }, [address]);

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto">
                    <header className="pt-2 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black heading-font text-neon-blue">PROFILE</h1>
                            <p className="text-sm text-zinc-400">Manage your empire settings</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            onClick={() => disconnect()}
                        >
                            Disconnect
                        </Button>
                    </header>

                    {/* Identity Card */}
                    <Card className="card-glow border-zinc-700">
                        <CardContent className="p-4 flex items-center gap-4">
                            {/* Manual Container instead of Identity wrapper to debug visibility */}
                            <div className="bg-transparent border-none p-0 flex flex-row items-center gap-4 w-full">
                                {displayAvatar ? (
                                    // Custom Avatar Render
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={displayAvatar} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#4A87FF]" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full border-2 border-[#4A87FF] bg-zinc-800 flex items-center justify-center">
                                        <span className="text-2xl">👤</span>
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    {/* Manual Render Block - Forces Font and Color */}
                                    <div
                                        className="font-bold text-lg heading-font text-white"
                                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }} // Force Glow
                                    >
                                        {displayName}
                                    </div>

                                    <div className="text-xs text-zinc-500 font-mono">
                                        {displaySubtext}
                                    </div>

                                    {/* DEBUG INFO - Will help diagnose missing data */}
                                    <div className="text-[10px] text-red-500 mt-1 font-mono">
                                        DEBUG: {address?.slice(0, 6)} | ENS: {ensName || 'null'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Referral Section */}
                    <Card className="card-glow border-[#D4AF37]/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white flex items-center gap-2">
                                🤝 Recruit Associates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Total Recruits</span>
                                <span className="text-white font-bold">{referralStats?.directInvitesUsed || 0}</span>
                            </div>

                            <Button
                                className="w-full bg-[#D4AF37] hover:bg-[#F4E5B8] text-black font-bold"
                                onClick={() => setIsReferralOpen(true)}
                            >
                                Get Referral Link
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Settings / Auto Agent */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold heading-font text-zinc-200">Agent Configuration</h2>
                        <AutoAgentPanel />
                    </div>

                    <ReferralModal
                        isOpen={isReferralOpen}
                        onClose={() => setIsReferralOpen(false)}
                        address={address}
                        referralCount={referralStats?.directInvitesUsed || 0}
                    />
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
