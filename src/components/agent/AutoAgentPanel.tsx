"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useSignTypedData, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

// ABI for AgentVault (minimal)
const AGENT_VAULT_ABI = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'balances',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const;

const AGENT_VAULT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_VAULT_ADDRESS as `0x${string}`;

interface AutoAgentPanelProps {
    compact?: boolean;
}

export default function AutoAgentPanel({ compact = false }: AutoAgentPanelProps) {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { signTypedDataAsync } = useSignTypedData();

    const [enabled, setEnabled] = useState(false);
    const [strategy, setStrategy] = useState('conservative');
    const [budget, setBudget] = useState('0');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Read Vault Balance
    const { data: vaultBalance, refetch: refetchBalance } = useReadContract({
        address: AGENT_VAULT_ADDRESS,
        abi: AGENT_VAULT_ABI,
        functionName: 'balances',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address,
        }
    });

    useEffect(() => {
        if (address) {
            fetch(`/api/agent/settings?userAddress=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.settings) {
                        setEnabled(data.settings.enabled);
                        setStrategy(data.settings.strategy);
                        setBudget(data.settings.budget.toString());
                        setIsConfigured(data.settings.budget > 0);
                    }
                });
        }
    }, [address]);

    const handleDeposit = async () => {
        if (!budget) return;
        try {
            setIsLoading(true);
            setStatusMsg("Submitting deposit...");
            const hash = await writeContractAsync({
                address: AGENT_VAULT_ADDRESS,
                abi: AGENT_VAULT_ABI,
                functionName: 'deposit',
                args: [parseEther(budget)]
            });
            setStatusMsg("Deposit successful: " + hash);
            refetchBalance();
        } catch (e) {
            setStatusMsg("Deposit failed: " + String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!vaultBalance || vaultBalance === 0n) return;
        try {
            setIsLoading(true);
            setStatusMsg("Withdrawing funds...");
            const hash = await writeContractAsync({
                address: AGENT_VAULT_ADDRESS,
                abi: AGENT_VAULT_ABI,
                functionName: 'withdraw',
                args: [vaultBalance] // Withdraw all for simplicity in this UI
            });
            setStatusMsg("Withdrawal successful. Funds returned.");
            refetchBalance();
        } catch (e) {
            setStatusMsg("Withdrawal failed: " + String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!address) return;
        try {
            setIsLoading(true);
            setStatusMsg("Signing delegation...");

            // 1. Sign Delegation
            const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
            const nonce = 0; // Should fetch nonce from contract in real app

            const signature = await signTypedDataAsync({
                domain: {
                    name: 'FarcasterCartelAgent',
                    version: '1',
                    chainId: 84532, // Base Sepolia
                    verifyingContract: AGENT_VAULT_ADDRESS
                },
                types: {
                    ExecuteAction: [
                        { name: 'user', type: 'address' },
                        { name: 'action', type: 'string' },
                        { name: 'data', type: 'bytes' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'deadline', type: 'uint256' }
                    ]
                },
                primaryType: 'ExecuteAction',
                message: {
                    user: address,
                    action: strategy === 'aggressive' ? 'raid' : 'claim',
                    data: '0x',
                    nonce: BigInt(nonce),
                    deadline: BigInt(deadline)
                }
            });

            setStatusMsg("Saving settings...");

            // 2. Save to Backend
            const res = await fetch('/api/agent/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: address,
                    enabled,
                    strategy,
                    budget: Number(budget),
                    delegation: {
                        signature,
                        deadline,
                        nonce
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                setStatusMsg("Agent settings saved!");
                setIsConfigured(true);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            setStatusMsg("Failed to save: " + String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const [suggestion, setSuggestion] = useState<any>(null);

    const handleGetSuggestion = async () => {
        if (!address) return;
        try {
            setIsLoading(true);
            setStatusMsg("Requesting paid raid suggestion...");

            // Dynamically import to avoid server-side issues if any
            const { getRaidSuggestion } = await import('@/lib/x402-client');
            const result = await getRaidSuggestion(address);

            setSuggestion(result);
            setStatusMsg("Suggestion received!");
        } catch (e) {
            setStatusMsg("Suggestion failed: " + String(e));
        } finally {
            setIsLoading(false);
        }
    };

    // --- COMPACT VIEW (Dashboard) ---
    if (compact) {
        return (
            <Card className="w-full card-glow border-zinc-800 bg-zinc-900/50">
                <CardHeader className="py-3 px-4">
                    <CardTitle className="flex items-center justify-between text-white text-base">
                        <span className="flex items-center gap-2">
                            🤖 Auto-Agent
                            {enabled && <span className="text-xs text-green-500 font-normal py-0.5 px-2 bg-green-500/10 rounded-full animate-pulse">Running</span>}
                        </span>

                        {isConfigured ? (
                            <Button
                                variant={enabled ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setEnabled(!enabled)} // Note: In real app this should trigger a save/update
                                className={`h-7 text-xs ${enabled ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700"}`}
                            >
                                {enabled ? "ON" : "OFF"}
                            </Button>
                        ) : (
                            <Link href="/profile">
                                <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-600 text-zinc-400">
                                    Configure
                                </Button>
                            </Link>
                        )}
                    </CardTitle>
                </CardHeader>
                {!isConfigured && (
                    <CardContent className="pb-3 px-4 pt-0">
                        <p className="text-xs text-zinc-500">
                            Setup strategies in <Link href="/profile" className="text-[#4A87FF] hover:underline">Profile</Link> to enable.
                        </p>
                    </CardContent>
                )}
            </Card>
        );
    }

    // --- FULL VIEW (Profile) ---
    return (
        <Card className="w-full bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-white">
                    <span>🤖 Strategy Control</span>
                    <Button
                        variant={enabled ? "default" : "secondary"}
                        onClick={() => setEnabled(!enabled)}
                        className={enabled ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700"}
                    >
                        {enabled ? "ON" : "OFF"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Balance & Withdraw Section */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold">Vault Balance</p>
                        <p className="text-xl font-mono text-[#4FF0E6]">
                            {vaultBalance ? formatEther(vaultBalance) : '0.00'} <span className="text-xs text-zinc-600">USDC</span>
                        </p>
                    </div>
                    {vaultBalance && vaultBalance > 0n && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50"
                            onClick={handleWithdraw}
                            disabled={isLoading}
                        >
                            Withdraw All
                        </Button>
                    )}
                </div>

                <AnimatePresence>
                    <motion.div
                        layout
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Strategy</Label>
                            <select
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                            >
                                <option value="conservative">Conservative (Claim Only)</option>
                                <option value="balanced">Balanced (Safe Raids)</option>
                                <option value="aggressive">Aggressive (Active Raids)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400">Daily Deposit (USDC)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="Amount to deposit"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                                <Button variant="outline" onClick={handleDeposit} disabled={isLoading}>
                                    Deposit
                                </Button>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                                Depositing increases your Vault Balance. The Agent uses this balance for gas & action fees.
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-800/50 rounded border border-zinc-700/50">
                            <Label className="text-zinc-400 mb-2 block">AI Intelligence (Paid)</Label>
                            <Button
                                variant="secondary"
                                className="w-full mb-2"
                                onClick={handleGetSuggestion}
                                disabled={isLoading}
                            >
                                Get Raid Suggestion ($0.005)
                            </Button>
                            {suggestion && (
                                <div className="text-xs text-zinc-300 bg-black/40 p-2 rounded">
                                    <p>Target: <span className="text-red-400">{suggestion.targetHandle}</span></p>
                                    <p>Est. Gain: <span className="text-green-400">{suggestion.estimatedGainShares.min}-{suggestion.estimatedGainShares.max} Shares</span></p>
                                    <p>Confidence: <span className="text-blue-400">{suggestion.confidence}%</span></p>
                                    <p>Risk: <span className="text-yellow-400">{suggestion.riskLevel}</span></p>
                                    <p className="italic mt-1">"{suggestion.reason}"</p>
                                </div>
                            )}
                        </div>

                        {statusMsg && (
                            <div className="text-sm text-yellow-400 p-2 bg-zinc-800 rounded">
                                {statusMsg}
                            </div>
                        )}

                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Save Configuration'}
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
