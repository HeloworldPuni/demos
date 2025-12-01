import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sdk } from "@farcaster/miniapp-sdk";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const [inviteLink, setInviteLink] = useState("");
    const [referralCount, setReferralCount] = useState(5); // Mock data
    const [bonusEarned, setBonusEarned] = useState(100); // Mock data
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Generate invite link with user's address as referrer
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            setInviteLink(`${baseUrl}?ref=YOUR_ADDRESS`);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        sdk.actions.composeCast({
            text: `Join me in the Base Cartel! Use my invite code: ${inviteLink}\n\nEarn yield, raid rivals, and rule the chain. 🔴🔵`,
            embeds: [inviteLink]
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-center text-purple-500 text-xl">
                        Invite Friends 🤝
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-zinc-400 text-sm text-center">
                            Earn <span className="text-purple-400 font-bold">+20 shares</span> for each friend who joins!
                        </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Total Referrals</span>
                            <span className="text-white font-bold">{referralCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Bonus Earned</span>
                            <span className="text-purple-400 font-bold">{bonusEarned} shares</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-zinc-400 text-xs">Your Invite Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 font-mono"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="px-4"
                            >
                                {copied ? "✓" : "Copy"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleShare} className="flex-1 bg-purple-600 hover:bg-purple-700">
                            Share on Farcaster
                        </Button>
                        <Button onClick={onClose} variant="outline" className="flex-1">
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
