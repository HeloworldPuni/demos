"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sdk } from "@farcaster/miniapp-sdk";
import PaymentModal from "./PaymentModal";
import { RAID_FEE, HIGH_STAKES_RAID_FEE, formatUSDC, CARTEL_POT_ADDRESS, USDC_ADDRESS } from "@/lib/basePay";
import { useAccount, useWriteContract, useReadContract, usePublicClient, useSendTransaction } from 'wagmi';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import ERC20ABI from "@/lib/abi/ERC20.json";

interface RaidModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetName?: string;
    targetAddress?: string; // New prop
}

export default function RaidModal({ isOpen, onClose, targetName = "Unknown Rival", targetAddress = "0x0000000000000000000000000000000000000000" }: RaidModalProps) {
    const [step, setStep] = useState<'confirm' | 'high-stakes-warning' | 'payment' | 'raiding' | 'result'>('confirm');
    const [raidType, setRaidType] = useState<'normal' | 'high-stakes'>('normal');
    const [result, setResult] = useState<'success' | 'fail'>('success');
    const [stolenAmount, setStolenAmount] = useState(0);
    const [selfPenalty, setSelfPenalty] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [manualTarget, setManualTarget] = useState("");
    const [isFindingTarget, setIsFindingTarget] = useState(false);

    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { sendTransactionAsync } = useSendTransaction();

    const publicClient = usePublicClient();

    // ALLOWANCE CHECK
    const currentFee = raidType === 'normal' ? RAID_FEE : HIGH_STAKES_RAID_FEE;
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address, CARTEL_POT_ADDRESS as `0x${string}`],
        query: { enabled: isOpen && !!address }
    });

    // [NEW] Resolve Target Name
    const [displayName, setDisplayName] = useState(targetName);

    useEffect(() => {
        if (!isOpen) {
            setDisplayName("Unknown Rival"); // Reset
            return;
        }

        const resolveName = async () => {
            // If we already have a name passed in prop, assume it's good (unless it's default)
            if (targetName !== "Unknown Rival") {
                setDisplayName(targetName);
                return;
            }

            // Otherwise try to resolve address
            if (targetAddress && targetAddress !== "0x0000000000000000000000000000000000000000") {
                try {
                    const res = await fetch(`/api/cartel/user/${targetAddress}`);
                    const data = await res.json();
                    if (data.success && data.user.fid) {
                        // We have an FID, try to fetch Farcaster profile or just show FID
                        // For speed, let's just show "Farcaster ID #123" if we don't have name
                        // OR if we stored username, show that.
                        // But our API only returns FID. Let's try to get name via Neynar/Warpcast if needed,
                        // or just fallback to "Recruit #{fid}".
                        // Actually, let's update the API to return the name if possible?
                        // Re-checking API code... it only selects FID. 
                        // Let's assume we want to show Farcaster ID for now.
                        setDisplayName(`Farcaster User #${data.user.fid}`);

                        // Better: Fetch name from Neynar (if we have key) or just stick to FID.
                        // Let's stick to FID to be safe/fast for now.
                    }
                } catch (e) {
                    console.log("Failed to resolve name", e);
                }
            }
        };
        resolveName();
    }, [isOpen, targetAddress, targetName]);

    if (!isOpen) return null;

    const handleInitiateRaid = () => {
        if (raidType === 'high-stakes') {
            setStep('high-stakes-warning');
        } else {
            setStep('payment');
        }
    };

    const handleAutoSelectTarget = async () => {
        setIsFindingTarget(true);
        try {
            const res = await fetch(`/api/cartel/targets/random?exclude=${address}`);
            const data = await res.json();
            if (data.success && data.target) {
                setManualTarget(data.target);
            } else {
                alert("No suitable targets found. Try again.");
            }
        } catch (error) {
            console.error("Failed to find target:", error);
        } finally {
            setIsFindingTarget(false);
        }
    };


    const handleConfirmHighStakes = () => {
        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        // Do NOT set Step to 'raiding' yet, wait for approval

        try {
            // Validate Inputs with Resolution
            let finalTarget = (targetAddress && targetAddress !== "0x0000000000000000000000000000000000000000")
                ? targetAddress
                : manualTarget;

            // RESOLVE USERNAME/FID if needed
            if (finalTarget && !finalTarget.startsWith("0x")) {
                console.log(`Resolving Farcaster user: ${finalTarget}...`);
                try {
                    const res = await fetch(`/api/farcaster/resolve?q=${finalTarget}`);
                    const data = await res.json();

                    if (data.user) {
                        // Prefer first verified address, then custody address
                        const resolvedAddr = data.user.verified_addresses?.eth_addresses?.[0] || data.user.custody_address;
                        if (resolvedAddr) {
                            console.log(`Resolved ${finalTarget} -> ${resolvedAddr}`);
                            finalTarget = resolvedAddr;
                            // Optionally update UI to show we found them
                        } else {
                            throw new Error(`User @${finalTarget} has no connected wallet.`);
                        }
                    } else {
                        throw new Error(`Farcaster user "${finalTarget}" not found.`);
                    }
                } catch (resolveError: any) {
                    console.error("Resolution Failed:", resolveError);
                    alert(resolveError.message || "Could not resolve Farcaster user.");
                    setIsProcessing(false);
                    return;
                }
            }

            if (!finalTarget || !finalTarget.startsWith("0x") || finalTarget.length !== 42) {
                console.warn("Invalid Target Address:", finalTarget);
                throw new Error("Invalid target address. Please enter a valid 0x address.");
            }

            const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;

            // 1. Check & Approve if needed
            if (allowance !== undefined && (allowance as bigint) < currentFee) {
                console.log("Allowance too low. Requesting approval...");

                const approveHash = await writeContractAsync({
                    address: USDC_ADDRESS as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: 'approve',
                    args: [CARTEL_POT_ADDRESS as `0x${string}`, BigInt("1000000000000")] // 1M USDC
                });
                console.log("Approve Tx sent:", approveHash);

                // WAIT FOR RECEIPT
                try {
                    if (publicClient) {
                        console.log("Waiting for confirmation...");
                        await publicClient.waitForTransactionReceipt({ hash: approveHash });
                        console.log("Approval Confirmed.");
                        // Short delay to let nodes sync
                        await new Promise(r => setTimeout(r, 2000));
                        await refetchAllowance();
                    } else {
                        console.warn("No public client, skipping wait. Transaction may fail.");
                    }
                } catch (waitError) {
                    console.error("Wait logic failed (ignoring):", waitError);
                }
            }

            // 2. Execute Raid
            const functionName = raidType === 'normal' ? 'raid' : 'highStakesRaid';
            console.log(`Executing ${functionName} on ${finalTarget}...`);

            // SIMULATE FIRST to catch reverts (e.g. invalid target) gracefully
            if (publicClient && address) {
                try {
                    await publicClient.simulateContract({
                        address: CORE_ADDRESS,
                        abi: CartelCoreABI,
                        functionName: functionName,
                        args: [finalTarget],
                        account: address
                    });
                } catch (simError: any) {
                    console.error("Simulation Reverted:", simError);
                    let msg = "Raid Validation Failed: ";
                    // Simple heuristic for common errors
                    if (simError.message?.includes("transfer amount exceeds balance")) msg += "Insufficient USDC balance.";
                    else if (simError.message?.includes("allowance")) msg += "Approval failed.";
                    else msg += "Target is likely invalid or not a registered player.";

                    // Show error in UI instead of crashing
                    alert(msg);
                    setIsProcessing(false);
                    return; // ABORT TRANSACTION
                }
            }

            // [BUILDER CODE INTEGRATION]
            // We use standard sendTransaction to manually append the capability suffix (Legacy method)
            const { encodeFunctionData } = await import('viem');
            const { appendBuilderSuffix } = await import('@/lib/builder-code');

            const data = encodeFunctionData({
                abi: CartelCoreABI,
                functionName: functionName,
                args: [finalTarget]
            });

            const dataWithSuffix = appendBuilderSuffix(data);

            const hash = await sendTransactionAsync({
                to: CORE_ADDRESS,
                data: dataWithSuffix,
            });

            setStep('raiding');
            console.log("Raid Tx:", hash);

            // [NEW] Revenue System V1: Record explicitly
            // Fire-and-forget (do not block UI)
            const feeInUSDC = Number(formatUSDC(currentFee));

            // 1. Record Revenue (For Global Charts)
            fetch('/api/cartel/revenue/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: hash,
                    amount: feeInUSDC,
                    type: raidType === 'normal' ? 'RAID' : 'HIGH_STAKES',
                    actor: address
                })
            }).catch(err => console.error("Revenue Record Failed:", err));

            // 2. [FIX] Record Heat Event (For Most Wanted)
            fetch('/api/cartel/events/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: hash,
                    type: raidType === 'normal' ? 'RAID' : 'HIGH_STAKES_RAID',
                    attacker: address,
                    target: finalTarget, // Ensure this is the resolved address
                    payout: 0, // Will be updated by indexer later, but event existence counts for Heat
                    stolenShares: 0 // Placeholder
                })
            }).catch(err => console.error("Heat Event Record Failed:", err));

            // [PERFORMANCE FIX]
            // Don't wait for the slow indexer. Wait for the chain directly.
            // As soon as the block is mined, the raid is real.
            console.log("Waiting for chain confirmation...");

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: hash,
                    confirmations: 1
                });

                if (receipt.status === 'success') {
                    console.log("Raid confirmed on-chain!");

                    // [FIX] Decode Logs to get actual values
                    const { decodeEventLog } = await import('viem');
                    let actualStolen = 0;
                    let actualPenalty = 0;

                    for (const log of receipt.logs) {
                        try {
                            const decoded = decodeEventLog({
                                abi: CartelCoreABI,
                                data: log.data,
                                topics: log.topics
                            });

                            if (decoded.eventName === 'Raid') {
                                // args: [raider, target, stolenShares, success, fee]
                                actualStolen = Number(decoded.args.stolenShares);
                            } else if (decoded.eventName === 'HighStakesRaid') {
                                // args: [attacker, target, stolenShares, selfPenalty, fee]
                                actualStolen = Number(decoded.args.stolenShares);
                                actualPenalty = Number(decoded.args.selfPenalty);
                            }
                        } catch (e) {
                            // Ignore logs from other contracts (USDC, etc)
                        }
                    }

                    setStolenAmount(actualStolen);
                    setSelfPenalty(actualPenalty);
                    setResult('success');
                    setStep('result');
                    setIsProcessing(false);
                } else {
                    throw new Error("Transaction reverted on chain.");
                }
            } else {
                // Fallback if no public client (rare)
                console.warn("No public client, waiting artificial delay.");
                await new Promise(r => setTimeout(r, 4000));
                setResult('success');
                setStep('result');
                setIsProcessing(false);
            }

        } catch (e) {
            console.error("Raid Failed:", e);
            // Handle specific errors
            // @ts-ignore
            if (e?.message?.includes("User rejected")) {
                // stay on payment step or go back
            }
            setResult('fail');
            setStep('result');
            setIsProcessing(false);
        }
    };

    const handleShare = () => {
        const gameUrl = "https://basecartel.in"; // Or window.location.origin
        let text = "";

        if (raidType === 'normal') {
            text = `I just raided @${targetName} and stole ${stolenAmount} shares in Base Cartel on Base ⚡\n\nCome at me: ${gameUrl}`;
        } else {
            text = `🔥 High-Stakes Raid success!\nI hit @${targetName}, stole ${stolenAmount} shares and burned ${selfPenalty} of my own in Base Cartel.\n\nDare to try? ${gameUrl}`;
        }

        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, "_blank");
    };

    const handleCloseModal = () => {
        setStep('confirm');
        setRaidType('normal'); // Reset type
        setIsProcessing(false);
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            {/* High-Stakes Flash Effect */}
            {showFlash && (
                <div className="fixed inset-0 z-[60] pointer-events-none animate-flash bg-gradient-to-br from-red-500/20 to-orange-500/20 mix-blend-overlay" />
            )}

            <Card className={`w-full max-w-sm bg-zinc-900 border-zinc-800 transition-all duration-500 ${raidType === 'high-stakes' ? 'shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)] border-red-900/50' : ''}`}>
                <CardHeader>
                    <CardTitle className={`text-center ${raidType === 'high-stakes' ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
                        {step === 'confirm' && "Prepare for Raid"}
                        {step === 'high-stakes-warning' && "⚠️ HIGH STAKES WARNING"}
                        {step === 'payment' && "Confirm Payment"}
                        {step === 'raiding' && "Raiding..."}
                        {step === 'result' && (
                            raidType === 'high-stakes'
                                ? (result === 'success' ? "High-Stakes Raid Successful 🔥" : "Raid Failed")
                                : (result === 'success' ? "Raid Successful" : "Raid Failed")
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'confirm' && (
                        <>
                            <p className="text-center text-zinc-300">
                                Target: <span className="font-bold text-white">{displayName}</span>
                            </p>

                            {/* Raid Type Toggle */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setRaidType('normal')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${raidType === 'normal'
                                        ? 'bg-zinc-800 border-zinc-600 text-white'
                                        : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    <span className="font-bold text-sm">Normal Raid</span>
                                    <span className="text-[10px] opacity-70 mt-1">Low risk • Standard fee</span>
                                </button>
                                <button
                                    onClick={() => setRaidType('high-stakes')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${raidType === 'high-stakes'
                                        ? 'bg-gradient-to-br from-red-950 to-orange-950 border-red-500 text-red-100 shadow-lg shadow-red-900/20'
                                        : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-red-900/50 hover:text-red-900'
                                        }`}
                                >
                                    <span className="font-bold text-sm">High-Stakes 🔥</span>
                                    <span className="text-[10px] opacity-70 mt-1">High risk • Burn shares</span>
                                </button>
                            </div>

                            <div className="bg-zinc-950 p-3 rounded-lg text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Raid Cost</span>
                                    <span className="text-green-400 font-bold">{formatUSDC(currentFee)} USDC</span>
                                </div>
                                {raidType === 'high-stakes' && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-red-400">Risk</span>
                                        <span className="text-red-400 font-bold">Self-Burn Penalty Possible</span>
                                    </div>
                                )}
                            </div>

                            {/* MANUAL TARGET INPUT & AUTO SELECT */}
                            {(!targetAddress || targetAddress === "0x0000000000000000000000000000000000000000") && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-zinc-500 uppercase font-bold">🎯 Target Address</label>
                                        <button
                                            onClick={handleAutoSelectTarget}
                                            disabled={isFindingTarget}
                                            className="text-[10px] text-blue-400 hover:text-blue-300 uppercase font-bold flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isFindingTarget ? <span className="animate-spin">🌀</span> : "🎲"}
                                            {isFindingTarget ? "Scanning..." : "Find Random Target"}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={manualTarget}
                                        placeholder="0x..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono"
                                        onChange={(e) => setManualTarget(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleCloseModal} className="flex-1">Cancel</Button>
                                <Button
                                    onClick={handleInitiateRaid}
                                    className={`flex-1 text-white font-bold transition-all ${raidType === 'high-stakes'
                                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-900/40 animate-pulse-slow'
                                        : 'bg-zinc-700 hover:bg-zinc-600'
                                        }`}
                                >
                                    {raidType === 'high-stakes' ? '🔥 High-Stakes Raid' : '⚔️ Raid'}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'high-stakes-warning' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-red-950/50 border border-red-900/50 p-4 rounded-lg space-y-3">
                                <p className="text-sm text-red-200 leading-relaxed">
                                    You are about to launch a <span className="font-bold text-red-400">High-Stakes Raid</span> on <span className="font-bold text-white">@{displayName}</span>.
                                </p>
                                <div className="space-y-2 text-xs text-red-300/80">
                                    <div className="flex justify-between">
                                        <span>Potential Reward:</span>
                                        <span className="text-green-400 font-bold">~20% of their shares</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Raid Fee:</span>
                                        <span className="text-white font-bold">{formatUSDC(currentFee)} USDC</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Self Penalty:</span>
                                        <span className="text-red-400 font-bold">You burn ~3% of your own</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setStep('confirm')} className="flex-1">Back</Button>
                                <Button
                                    onClick={handleConfirmHighStakes}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/50"
                                >
                                    Confirm High-Stakes 🔥
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'raiding' && (
                        <div className="flex flex-col items-center py-8">
                            <div className={`text-5xl mb-4 ${raidType === 'high-stakes' ? 'animate-bounce' : 'animate-spin'}`}>
                                {raidType === 'high-stakes' ? '🔥' : '⚔️'}
                            </div>
                            <p className="text-zinc-400 animate-pulse">
                                {raidType === 'high-stakes' ? 'Scorching the earth...' : 'Infiltrating hideout...'}
                            </p>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="text-center space-y-4">
                            <div className="text-6xl animate-in zoom-in duration-300">
                                {result === 'success' ? (raidType === 'high-stakes' ? "🔥" : "💰") : "💀"}
                            </div>
                            {result === 'success' ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-zinc-300">
                                            You hit <span className="font-bold text-white">@{displayName}</span> hard.
                                        </p>
                                        {raidType === 'high-stakes' && (
                                            <p className="text-xs text-orange-400 font-medium tracking-widest uppercase">Reputation forged in fire</p>
                                        )}
                                    </div>

                                    <div className={`p-4 rounded-lg space-y-2 ${raidType === 'high-stakes' ? 'bg-gradient-to-br from-red-950/50 to-orange-950/50 border border-red-900/30' : 'bg-zinc-950'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-400">Stolen Shares</span>
                                            <span className="text-green-400 font-bold text-xl">+{stolenAmount}</span>
                                        </div>
                                        {raidType === 'high-stakes' && selfPenalty > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-zinc-400">Self-Burned</span>
                                                <span className="text-red-400 font-bold">-{selfPenalty}</span>
                                            </div>
                                        )}
                                        {raidType === 'high-stakes' && (
                                            <div className="flex justify-between items-center pt-2 border-t border-red-900/30 mt-2">
                                                <span className="text-zinc-300 font-bold">Net Gain</span>
                                                <span className="text-orange-400 font-bold">+{stolenAmount - selfPenalty}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-red-400 font-bold">
                                    Your squad was wiped out.
                                </p>
                            )}

                            {result === 'success' && (
                                <Button onClick={handleShare} className="w-full bg-[#855DCD] hover:bg-[#724BB7] text-white font-bold">
                                    Share on Farcaster
                                </Button>
                            )}

                            <Button variant="ghost" onClick={handleCloseModal} className="w-full">
                                Close
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaymentModal
                isOpen={step === 'payment'}
                amount={formatUSDC(currentFee)}
                action={raidType === 'high-stakes' ? `High-Stakes Raid ${displayName}` : `Raid ${displayName}`}
                onConfirm={handleConfirmPayment}
                onCancel={() => setStep('confirm')}
                isProcessing={isProcessing}
            />
        </div>
    );
}
