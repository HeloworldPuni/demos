import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PaymentModal from "./PaymentModal";
import { JOIN_FEE, formatUSDC, CARTEL_CORE_ADDRESS } from "@/lib/basePay";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFrameContext } from "./providers/FrameProvider";
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
    Address,
    Avatar,
    Name,
    Identity,
    EthBalance,
} from '@coinbase/onchainkit/identity';

interface JoinCartelProps {
    onJoin: (inviteCode: string) => void;
}

export default function JoinCartel({ onJoin }: JoinCartelProps) {
    const { isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const frameContext = useFrameContext();
    const { context, isInMiniApp } = frameContext || {};

    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: hash,
    });

    // Auto-connect if in MiniApp
    useEffect(() => {
        if (isInMiniApp && !isConnected) {
            const farcasterConnector = connectors.find(c => c.id === 'farcaster-miniapp');
            if (farcasterConnector) {
                connect({ connector: farcasterConnector });
            }
        }
    }, [isInMiniApp, isConnected, connectors, connect]);

    useEffect(() => {
        if (isConfirmed) {
            setIsProcessing(false);
            setShowPayment(false);
            setIsLoading(true);
            // Allow time for indexer/RPC to update
            setTimeout(() => {
                onJoin(inviteCode);
            }, 2000);
        }
    }, [isConfirmed, onJoin, inviteCode]);

    const handleJoinClick = () => {
        if (!inviteCode) {
            alert("Invite code required for Phase 1!");
            return;
        }
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(inviteCode)) {
            alert("Invalid invite code! Must be a valid Ethereum address.");
            return;
        }
        setShowPayment(true);
    };

    const handleConfirmPayment = () => {
        setIsProcessing(true);

        writeContract({
            address: CARTEL_CORE_ADDRESS as `0x${string}`,
            abi: [
                {
                    name: 'join',
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [{ name: 'referrer', type: 'address' }],
                    outputs: []
                }
            ],
            functionName: 'join',
            args: [inviteCode as `0x${string}`],
        }, {
            onError: (error) => {
                console.error("Join failed:", error);
                setIsProcessing(false);
                alert("Failed to join: " + (error as any).shortMessage || error.message);
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-[400px] bg-[#1B1F26] border-[#4A87FF]/30 shadow-2xl">
                <CardHeader className="text-center pb-8 pt-8">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">🎩</div>
                        <CardTitle className="text-4xl font-black heading-font text-neon-blue mb-2">
                            BASE CARTEL
                        </CardTitle>
                        <p className="text-sm text-[#D4AF37] font-medium tracking-wider">
                            RULE THE CHAIN
                        </p>
                    </div>
                    {isInMiniApp && context?.user && (
                        <div className="flex flex-col items-center gap-2 mt-4 animate-fade-in">
                            {context.user.pfpUrl && (
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
                        Join the most ruthless syndicate on Base. Earn profit share, raid rivals, and climb the ranks.
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
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Profit Share</span>
                            <span className="text-[#4FF0E6] font-bold">Enabled ✓</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Gas Fees</span>
                            <span className="text-[#4FF0E6] font-bold">Sponsored ✨</span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-zinc-400">
                                {isInMiniApp ? "Connecting to your account..." : "Connect your wallet to verify eligibility."}
                            </p>
                            {!isInMiniApp && (
                                <Button
                                    className="w-full bg-[#4A87FF] hover:bg-[#5A97FF] text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        const connector = connectors.find(c => c.id === 'coinbaseWalletSDK');
                                        if (connector) {
                                            connect({ connector });
                                        } else {
                                            // Fallback to first available if coinbase not found
                                            const first = connectors[0];
                                            if (first) connect({ connector: first });
                                        }
                                    }}
                                >
                                    <Avatar className="h-6 w-6" />
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 font-medium">Invite Code (Required)</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="w-full bg-[#0B0E12] border-2 border-[#4A87FF]/30 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#4A87FF] focus:glow-blue transition-all"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-[#4A87FF] to-[#4FF0E6] hover:from-[#5A97FF] hover:to-[#5FFFF6] text-white font-bold py-6 text-lg rounded-lg glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleJoinClick}
                                disabled={isLoading || !inviteCode}
                            >
                                {isLoading ? "Joining..." : "Join the Cartel"}
                            </Button>
                        </>
                    )}

                    <p className="text-center text-xs text-zinc-600 mt-4">
                        Phase 1: Invite-Only Access
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
