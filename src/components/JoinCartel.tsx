"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PaymentModal from "./PaymentModal";
import { JOIN_FEE, formatUSDC } from "@/lib/basePay";

import { useAccount, useConnect, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { useFrameContext } from "./providers/FrameProvider";
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import CartelSharesABI from '@/lib/abi/CartelShares.json';

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

    // Auto-populate from URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) setInviteCode(ref);
        }
    }, []);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { writeContractAsync } = useWriteContract();

    // CHAIN SOURCE OF TRUTH: Check Shares DIRECTLY
    const sharesAddress = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;
    const coreAddress = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;

    const { data: shareBalance, refetch: refetchShares } = useReadContract({
        address: sharesAddress,
        abi: CartelSharesABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`, 1n],
        query: {
            enabled: !!address && !!sharesAddress,
        }
    });

    // Auto-login if shares detected on chain
    useEffect(() => {
        if (shareBalance && Number(shareBalance) > 0) {
            console.log("Found on-chain shares! Syncing...");
            // Trigger indexer to ensure DB is up to date
            fetch('/api/cron/index', { method: 'POST' })
                .finally(() => {
                    onJoin(inviteCode || "EXISTING");
                });
        }
    }, [shareBalance, address, onJoin, context?.user?.fid]);


    // Auto-connect if in MiniApp
    useEffect(() => {
        if (isInMiniApp && !isConnected) {
            const farcasterConnector = connectors.find(c => c.id === 'farcaster-miniapp');
            if (farcasterConnector) {
                connect({ connector: farcasterConnector });
            }
        }
    }, [isInMiniApp, isConnected, connectors, connect]);

    const handleJoinClick = () => {
        if (inviteCode && !inviteCode.startsWith("BASE-")) {
            alert("Invalid referral code format! Must start with BASE-");
            return;
        }
        setShowPayment(true);
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        setErrorMessage(null);

        try {
            console.log("--- CHAIN-FIRST JOIN FLOW ---");

            // 1. Double Check Chain State (Redundant safety)
            if (shareBalance && Number(shareBalance) > 0) {
                alert("You are already a member! logging you in...");
                onJoin(inviteCode);
                return;
            }

            // 2. Resolve Invite (Stateless)
            console.log("Resolving invite...");
            const resolveRes = await fetch('/api/referral/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode })
            });

            const resolveData = await resolveRes.json();

            if (inviteCode && !resolveData.isValid) {
                throw new Error(resolveData.error || "Invalid invite code");
            }

            const referrer = resolveData.referrerAddress || "0x0000000000000000000000000000000000000000";
            console.log("Using Referrer:", referrer);

            if (!coreAddress) throw new Error("Contract config missing");

            // 3. EXECUTE ON CHAIN
            console.log("Requesting Wallet Signature...");
            // Direct write. If it fails, we catch it. No DB records created yet.
            const hash = await writeContractAsync({
                address: coreAddress,
                abi: CartelCoreABI,
                functionName: 'join',
                args: [referrer as `0x${string}`]
            });
            console.log("Tx Hash:", hash);

            // 4. TRIGGER INDEXER (The "Sync")
            console.log("Tx submitted. Triggering Indexer...");

            // Wait a moment for block propagation
            await new Promise(r => setTimeout(r, 2000));

            // Trigger the indexer to catch the new Join event
            await fetch('/api/cron/index', { method: 'POST' });

            // Optimistic Update / Completion
            setIsProcessing(false);
            setShowPayment(false);
            setIsLoading(true);

            // Allow time for indexer to write DB
            setTimeout(() => onJoin(inviteCode), 2000);

        } catch (error: any) {
            console.error("Join Failed:", error);
            const msg = error.message || "Unknown error";

            // Handle "Already Joined" specifically from contract revert
            if (msg.toLowerCase().includes("already joined")) {
                alert("Chain says you already joined! Refreshing...");
                refetchShares();
            } else {
                alert(`Join Failed: ${msg}`);
            }
            setIsProcessing(false);
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
                            V3.0: CHAIN AUTHORITY
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-8">
                    <p className="text-center text-zinc-400 text-sm leading-relaxed">
                        Open Access. Zero Zombie Mode.
                    </p>

                    <div className="card-glow p-5 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Entry Fee</span>
                            <span className="text-[#3DFF72] font-bold text-lg">FREE</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Status</span>
                            <span className="text-white font-bold text-lg">
                                {shareBalance && Number(shareBalance) > 0 ? "Member" : "Guest"}
                            </span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <Button
                            className="w-full bg-[#4A87FF] hover:bg-[#5A97FF] py-4 font-bold"
                            onClick={() => {
                                const cb = connectors.find(c => c.id === 'coinbaseWalletSDK');
                                const injected = connectors.find(c => c.id === 'injected');
                                const target = cb || injected || connectors[0];
                                if (target) connect({ connector: target });
                                else alert("No wallet connectors found!");
                            }}
                        >
                            Connect Wallet
                        </Button>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 font-medium">Referral Code (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="BASE-XXXXXX"
                                    className="w-full bg-[#0B0E12] border-2 border-[#4A87FF]/30 rounded-lg p-3 text-white"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full bg-gradient-to-r from-[#4A87FF] to-[#4FF0E6] py-6 font-bold text-lg"
                                onClick={handleJoinClick}
                                disabled={isLoading || (shareBalance && Number(shareBalance) > 0)}
                            >
                                {isLoading ? "Joining..." : "Join the Cartel (v3)"}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <PaymentModal
                isOpen={showPayment}
                amount={formatUSDC(JOIN_FEE)}
                action="Join the Cartel"
                onConfirm={handleConfirmPayment}
                onCancel={() => {
                    setShowPayment(false);
                    setErrorMessage(null);
                }}
                isProcessing={isProcessing}
                errorMessage={errorMessage}
            />
        </div>
    );
}
