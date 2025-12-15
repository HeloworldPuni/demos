"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import { decodeEventLog, formatUnits } from 'viem';

interface BetrayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EXPECTED_CHAIN_ID = 8453; // Base Mainnet

export default function BetrayModal({ isOpen, onClose }: BetrayModalProps) {
    const [step, setStep] = useState<'warn' | 'confirm' | 'betraying' | 'result'>('warn');
    const [payout, setPayout] = useState<string>("0");
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [errorMsg, setErrorMsg] = useState("");

    const { address, chain } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const { writeContractAsync, isPending: isWriting } = useWriteContract();
    const {
        data: receipt,
        isLoading: isWaiting,
        isSuccess: isConfirmed,
        isError: isReceiptError
    } = useWaitForTransactionReceipt({
        hash: txHash,
        chainId: EXPECTED_CHAIN_ID
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { composeCast } = useComposeCast() as any;

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setStep('warn');
            setTxHash(undefined);
            setPayout("0");
            setErrorMsg("");
        }
    }, [isOpen]);

    // Transaction Confirmation Effect
    useEffect(() => {
        if (isConfirmed && receipt) {
            if (receipt.status !== 'success') {
                setErrorMsg("Transaction reverted on-chain.");
                setStep('warn');
                return;
            }

            // 1. Parse Logs for Payout
            let betrayalPayout = "0";
            try {
                for (const log of receipt.logs) {
                    try {
                        const event = decodeEventLog({
                            abi: CartelCoreABI,
                            data: log.data,
                            topics: log.topics
                        });
                        if (event.eventName === 'Betrayal') {
                            // event Betrayal(address indexed traitor, uint256 amountStolen)
                            const args = event.args as unknown as { amountStolen: bigint };
                            betrayalPayout = formatUnits(args.amountStolen, 6); // Assuming USDC (6 decimals)
                            break;
                        }
                    } catch { continue; }
                }
            } catch (err) {
                console.error("Log Parsing Error:", err);
                // Proceed even if log parse fails, but warn? No, core logic depends on it. 
                // We'll set payout to 0 if not found.
            }

            setPayout(betrayalPayout);

            // 2. Call API (Idempotent DB Cleanup)
            fetch('/api/pay/betray', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: receipt.transactionHash,
                    traitorAddress: address // For verification only, backend uses tx signer
                })
            }).then(async (res) => {
                if (!res.ok) {
                    console.error("API Sync Failed");
                    // User is still betrayed on-chain, so we show result but maybe warn
                }
                setStep('result');
            }).catch(err => {
                console.error("API Error", err);
                setStep('result');
            });
        }

        if (isReceiptError) {
            setErrorMsg("Transaction failed to confirm.");
            setStep('warn');
        }
    }, [isConfirmed, receipt, isReceiptError, address]);

    if (!isOpen) return null;

    const handleBetray = async () => {
        setErrorMsg("");

        // Network Guard
        if (chainId !== EXPECTED_CHAIN_ID) {
            if (switchChain) {
                switchChain({ chainId: EXPECTED_CHAIN_ID });
                return;
            }
            setErrorMsg("Wrong Network. Please switch to Base.");
            return;
        }

        setStep('betraying');

        try {
            const hash = await writeContractAsync({
                address: process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`,
                abi: CartelCoreABI,
                functionName: 'betray', // Updated to match ABI function name 'betray' (or retireFromCartel if alias, sticking to ABI)
                // ABI has 'betray' and 'retireFromCartel'? User context said ABI has 'betray' and 'retireFromCartel'.
                // Checking previous code it handled both names. I will use 'betray' based on ABI analysis.
                args: []
            });
            setTxHash(hash);
            // Now we wait for receipt loop
        } catch (e: any) {
            console.error("Betrayal Rejected:", e);
            setErrorMsg(e.code === 4001 ? "User rejected transaction." : "Transaction failed to submit.");
            setStep('warn');
        }
    };

    const handleShare = () => {
        composeCast({
            text: `I just BETRAYED the Base Cartel and ran away with ${payout} USDC! 🏃💨\n\nTrust no one.`,
            embeds: []
        });
        onClose();
    };

    const isProcessing = step === 'betraying' || isWriting || isWaiting;

    return (
        <div className="fixed inset-0 bg-red-950/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-sm bg-black border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <CardHeader>
                    <CardTitle className="text-center text-red-500 text-2xl font-black uppercase tracking-widest animate-pulse">
                        {step === 'warn' && "⚠️ WARNING ⚠️"}
                        {step === 'confirm' && "FINAL CHANCE"}
                        {step === 'betraying' && "BETRAYING..."}
                        {step === 'result' && "TRAITOR"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {errorMsg && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 p-2 text-xs font-mono text-center rounded">
                            {errorMsg}
                        </div>
                    )}

                    {step === 'warn' && (
                        <>
                            <p className="text-center text-red-200 font-mono">
                                You are about to betray the Cartel. This action is <span className="font-bold underline">IRREVERSIBLE</span>.
                            </p>
                            <p className="text-center text-red-400 text-sm">
                                You will burn ALL your shares and reputation to steal a portion of the pot.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 border-zinc-700"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setStep('confirm')}
                                    className="flex-1 bg-red-900 hover:bg-red-800 text-white border border-red-500"
                                    disabled={isProcessing}
                                >
                                    I understand
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'confirm' && (
                        <>
                            <p className="text-center text-white font-bold text-lg">
                                Are you absolutely sure?
                            </p>
                            <p className="text-center text-zinc-400 text-xs">
                                Your name will be permanently marked as a Traitor.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleBetray}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 text-xl animate-bounce"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "SIGNING..." : "🔴 EXECUTE BETRAYAL"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-zinc-500 hover:text-zinc-300"
                                    disabled={isProcessing}
                                >
                                    Abort Mission
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'betraying' && (
                        <div className="flex flex-col items-center py-8">
                            <div className="text-6xl mb-4 animate-spin">☠️</div>
                            <p className="text-red-500 font-mono animate-pulse">Running away...</p>
                            <p className="text-xs text-red-700 font-mono mt-2">Do not close this window</p>
                            {isWaiting && <p className="text-xs text-zinc-500 mt-2 animate-pulse">Confirming Transaction...</p>}
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl">💸</div>
                            <div>
                                <p className="text-zinc-400">You escaped with</p>
                                <p className="text-green-500 font-black text-4xl">${Number(payout).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <p className="text-red-500 text-xs font-mono">
                                You are now exiled from the Cartel.
                            </p>
                            <Button onClick={handleShare} className="w-full bg-white text-black hover:bg-zinc-200">
                                Broadcast Your Crime
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
