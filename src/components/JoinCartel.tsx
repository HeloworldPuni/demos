"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PaymentModal from "./PaymentModal";
import { JOIN_FEE, formatUSDC } from "@/lib/basePay";

import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { useFrameContext } from "./providers/FrameProvider";
import CartelCoreABI from '@/lib/abi/CartelCore.json';
// Removed unused Avatar import

interface JoinCartelProps {
    onJoin: (inviteCode: string) => void;
}

export default function JoinCartel({ onJoin }: JoinCartelProps) {
    const { isConnected, address } = useAccount();
    const { connect, connectors } = useConnect();
    const frameContext = useFrameContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { context, isInMiniApp } = (frameContext || {}) as any;

    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Removed unused writeContract
    // const { writeContract, data: hash } = useWriteContract();
    // Assuming hash was used in useWaitForTransactionReceipt, we need to check if it's actually used.
    // Looking at the original code, useWaitForTransactionReceipt was using `hash`. 
    // If writeContract is removed, hash is gone. 
    // But wait, the component logic relies on `isConfirmed` from `useWaitForTransactionReceipt`.
    // However, the new logic uses `fetch` to `/api/auth/join-with-invite` and does NOT use `writeContract` anymore.
    // So `useWaitForTransactionReceipt` might also be unused if we are not sending a transaction on chain directly here.
    // Let's check the handleConfirmPayment logic again.
    // It calls `fetch`, then sets `isConfirmed` logic manually via state? No, it sets `setIsProcessing(false)` and `setShowPayment(false)`.
    // The `useEffect` listening to `isConfirmed` is likely dead code now if we aren't using `writeContract`.

    // Let's remove the dead hook usage entirely.

    // Auto-connect if in MiniApp
    useEffect(() => {
        if (isInMiniApp && !isConnected) {
            const farcasterConnector = connectors.find(c => c.id === 'farcaster-miniapp');
            if (farcasterConnector) {
                connect({ connector: farcasterConnector });
            }
        }
    }, [isInMiniApp, isConnected, connectors, connect]);

    // Removed dead useEffect for transaction receipt as we use API now

    const handleJoinClick = () => {
        // Validation format check only if provided
        if (inviteCode && !inviteCode.startsWith("BASE-")) {
            alert("Invalid referral code format! Must start with BASE-");
            return;
        }
        setShowPayment(true);
    };

    const { writeContractAsync } = useWriteContract();

    // ... imports above

    const handleConfirmPayment = async () => {
        setIsProcessing(true);

        try {
            // 1. Validate Invite & Get Referrer via API
            const response = await fetch('/api/auth/join-with-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    farcasterId: context?.user?.fid,
                    inviteCode: inviteCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'User already exists') {
                    console.log("User already exists in DB, checking on-chain...");
                    // Proceed to try on-chain join anyway, or skip if handled?
                    // For now, we assume if in DB, they might need to mint if txn failed previously.
                } else {
                    throw new Error(data.error || 'Failed to join');
                }
            }

            const referrer = data.referrerAddress;
            if (!referrer) throw new Error("Referrer address missing");

            // 2. Execute On-Chain Join (Mint Shares)
            console.log("Minting shares on-chain...");
            const hash = await writeContractAsync({
                address: process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`,
                abi: CartelCoreABI,
                functionName: 'join',
                args: [referrer]
            });
            console.log("Join txn submitted:", hash);

            // 3. Success UI
            setIsProcessing(false);
            setShowPayment(false);
            setIsLoading(true);

            setTimeout(() => {
                onJoin(inviteCode);
            }, 2000); // Wait bit longer for animation

        } catch (error) {
            console.error("Join failed:", error);
            setIsProcessing(false);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert("Failed to join: " + (error as any).message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-[400px] bg-[#1B1F26] border-[#4A87FF]/30 shadow-2xl">
                <CardHeader className="text-center pb-8 pt-8">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">🎩</div>
                        <CardTitle className="text-4xl font-black heading-font text-neon-blue mb-2">
                            ENTER THE CARTEL
                        </CardTitle>
                        <p className="text-sm text-[#D4AF37] font-medium tracking-wider">
                            INVITE-ONLY ACCESS
                        </p>
                    </div>
                    {isInMiniApp && context?.user && (
                        <div className="flex flex-col items-center gap-2 mt-4 animate-fade-in">
                            {context.user.pfpUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={context.user.pfpUrl} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#4A87FF] glow-blue" />
                            )}
                            <p className="text-zinc-300 font-medium">
                                Welcome, <span className="text-[#4A87FF]">@{context.user.username}</span>
                            </p>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-8">
                    <p className="text-center text-zinc-400 text-sm leading-relaxed">
                        Open Access for limited time. Join now.
                    </p>

                    <div className="card-glow p-5 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Entry Fee</span>
                            <span className="text-[#3DFF72] font-bold text-lg">FREE</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Initial Shares</span>
                            <span className="text-white font-bold text-lg">100</span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-zinc-400">
                                {isInMiniApp ? "Connecting to your account..." : "Connect your wallet to verify eligiblity."}
                            </p>
                            {!isInMiniApp && (
                                <Button
                                    className="w-full bg-[#4A87FF] hover:bg-[#5A97FF] text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        const connector = connectors.find(c => c.id === 'coinbaseWalletSDK');
                                        if (connector) {
                                            connect({ connector });
                                        } else {
                                            const first = connectors[0];
                                            if (first) connect({ connector: first });
                                        }
                                    }}
                                >
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 font-medium">Referral Code (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="BASE-XXXXXX"
                                    className="w-full bg-[#0B0E12] border-2 border-[#4A87FF]/30 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#4A87FF] focus:glow-blue transition-all"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-[#4A87FF] to-[#4FF0E6] hover:from-[#5A97FF] hover:to-[#5FFFF6] text-white font-bold py-6 text-lg rounded-lg glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleJoinClick}
                                disabled={isLoading}
                            >
                                {isLoading ? "Joining..." : "Join the Cartel"}
                            </Button>
                        </>
                    )}

                    <p className="text-center text-xs text-zinc-600 mt-4">
                        Open Access · Referrals earn bonus shares
                    </p>
                </CardContent>
            </Card>

            <PaymentModal
                isOpen={showPayment}
                amount={formatUSDC(JOIN_FEE)}
                action="Join the Cartel"
                onConfirm={handleConfirmPayment}
                onCancel={() => setShowPayment(false)}
                isProcessing={isProcessing}
            />
        </div>
    );
}
