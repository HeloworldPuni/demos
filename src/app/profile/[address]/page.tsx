"use client";

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";

// Icons
import { Sword, Shield, Crosshair } from 'lucide-react';

interface PublicProfileProps {
    params: {
        address: string;
    }
}

export default function PublicProfilePage({ params }: PublicProfileProps) {
    // 1. Target Address
    const targetAddress = params.address as `0x${string}`;

    // 2. Viewer Address
    const { address: viewerAddress } = useAccount();
    const isSelf = viewerAddress && viewerAddress.toLowerCase() === targetAddress.toLowerCase();

    // 3. Resolve Identity
    const { data: ensName } = useEnsName({ address: targetAddress, chainId: 8453 });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined, chainId: 8453 });

    // 4. Mock Stats (To be wired to API later)
    // Ideally we fetch from /api/cartel/profile/[address] or similar
    // For now, let's just show the identity to fix the 404

    const displayName = ensName || `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;

    return (
        <AppLayout>
            <motion.div {...motionPage}>
                <header className="pt-2 mb-6">
                    <h1 className="text-2xl font-black heading-font text-zinc-500 uppercase">
                        {isSelf ? "MY FILE" : "SURVEILLANCE"}
                    </h1>
                    <p className="text-sm text-zinc-400 font-mono text-[10px]">
                        SUBJECT: {targetAddress}
                    </p>
                </header>

                {/* Identity Card */}
                <Card className="card-glow border-zinc-700 mb-6">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex flex-row items-center gap-4 w-full">
                            {/* Avatar */}
                            <div className={`p-1 border-2 ${isSelf ? 'border-blue-500' : 'border-red-500'} rounded-full shrink-0`}>
                                {ensAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={ensAvatar}
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-16 h-16 rounded-full ${isSelf ? 'bg-blue-900/20' : 'bg-red-900/20'} flex items-center justify-center`}>
                                        <span className="text-2xl">
                                            {isSelf ? '👤' : '🎯'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col min-w-0">
                                <div className="font-bold text-lg heading-font text-white truncate flex items-center gap-2">
                                    {displayName}
                                    {isSelf && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">YOU</span>}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                    Base Mainnet
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                {!isSelf && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20"
                            disabled // Placeholder for future Raid feature
                        >
                            <Crosshair className="w-4 h-4 mr-2" />
                            Raid Target
                        </Button>
                        <Button
                            variant="outline"
                            className="text-zinc-400 border-zinc-700"
                            onClick={() => {
                                navigator.clipboard.writeText(targetAddress);
                            }}
                        >
                            Copy Address
                        </Button>
                    </div>
                )}

                {/* Placeholder Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Heat</div>
                        <div className="text-xl font-black text-red-500">???</div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Rank</div>
                        <div className="text-xl font-black text-zinc-300">#???</div>
                    </div>
                </div>

            </motion.div>
        </AppLayout>
    );
}
