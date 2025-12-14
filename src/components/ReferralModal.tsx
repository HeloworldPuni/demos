"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sdk } from "@farcaster/miniapp-sdk";

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    address?: string;
    referralCount?: number;
}

export default function ReferralModal({ isOpen, onClose, address, referralCount = 0 }: ReferralModalProps) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && address) {
            setIsLoadingCode(true);
            setError(null);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://basecartel.in';

            fetch(`/api/me/invites?walletAddress=${address}`)
                .then(res => {
                    if (!res.ok) throw new Error(res.status === 403 ? "Join the cartel to get invites." : "Failed to load invites.");
                    return res.json();
                })
                .then(data => {
                    if (data.invites && data.invites.length > 0) {
                        const code = data.invites[0].code;
                        setInviteCode(code);
                        setInviteLink(`${baseUrl}?ref=${code}`);
                        setError(null);
                    } else {
                        // V5 Logic: If API didn't return invites, something is wrong or 403 would have triggered.
                        setError("No invites available. Please try refreshing.");
                    }
                })
                .catch(e => {
                    console.error("Invite load error:", e);
                    setError(e.message || "Failed to load invites.");
                })
                .finally(() => setIsLoadingCode(false));
        }
    }, [isOpen, address]);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ... (rest of logic)

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md card-glow border-[#4FF0E6]/40">
                {/* ... Header ... */}

                <CardContent className="space-y-6">
                    {/* ... Stats ... */}

                    <div className="space-y-2">
                        <label className="text-zinc-400 text-xs font-medium">Your Referral Link</label>

                        {isLoadingCode ? (
                            <div className="flex-1 bg-[#0B0E12] border border-[#4A87FF]/30 rounded-lg px-3 py-2 text-sm text-zinc-500 font-mono flex items-center justify-center animate-pulse">
                                Loading unique codes...
                            </div>
                        ) : error ? (
                            <div className="flex-1 bg-red-900/20 border border-red-500/50 rounded-lg px-3 py-2 text-sm text-red-400 font-mono flex items-center justify-center">
                                ⚠️ {error}
                            </div>
                        ) : inviteLink ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1 bg-[#0B0E12] border border-[#4A87FF]/30 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none"
                                />
                                <Button
                                    onClick={handleCopyLink}
                                    variant="outline"
                                    className="px-4 border-[#4FF0E6]/40 bg-[#4FF0E6]/10 hover:bg-[#4FF0E6]/20 text-[#4FF0E6]"
                                >
                                    {copied ? "✓" : "Copy"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 bg-red-900/20 border border-red-500/50 rounded-lg px-3 py-2 text-sm text-red-400 font-mono flex items-center justify-center">
                                ⚠️ Unexpected Missing Data
                            </div>
                        )}
                    </div>


                    <div className="flex gap-3">
                        <Button
                            onClick={handleShare}
                            className="flex-1 bg-gradient-to-r from-[#4FF0E6] to-[#4A87FF] hover:from-[#5FFFF6] hover:to-[#5A97FF] text-white font-bold rounded-lg glow-cyan"
                        >
                            Share on Farcaster
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-zinc-700 hover:bg-zinc-800 text-white rounded-lg"
                        >
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
