"use client";

import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CartelDashboardProps {
    address?: string; // Included to satisfy parent TS, unused logic
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto pb-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#0B0E12]/40 to-[#0B0E12] pointer-events-none blur-3xl opacity-80" />
            <div className="absolute top-[-40px] right-[-40px] text-[10rem] opacity-[0.03] pointer-events-none rotate-12 blur-sm">🎩</div>

            {/* HERO HEADER */}
            <header className="flex flex-col items-center pt-6 pb-4 relative z-10 w-full">
                <div className="relative mb-2">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">🎩</span>
                </div>

                <div className="flex items-center justify-center gap-3 w-full px-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                    <Badge variant="outline" className="bg-[#1A1D26] text-[#D4AF37] border-[#D4AF37]/30 text-[10px] tracking-wider uppercase px-3 py-1 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        Season 1 • Live
                    </Badge>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                </div>

                <h2 className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-3 uppercase opacity-70">Empire Earnings Today</h2>
            </header>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3">

                {/* Shares */}
                <StatCard className="h-full border-[#D4AF37]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-0 pb-1">
                        <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Your Shares</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-black text-white">157</div>
                        <p className="text-[10px] text-zinc-500">Global Rank #42</p>
                    </CardContent>
                </StatCard>

                {/* Pot */}
                <StatCard className="h-full border-[#3B82F6]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-0 pb-1">
                        <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Cartel Pot</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-black text-white">$4,291</div>
                        <p className="text-[10px] text-zinc-500">USDC Vault</p>
                    </CardContent>
                </StatCard>

                {/* Revenue */}
                <div className="col-span-2">
                    <StatCard className="border-[#4FF0E6]/20 relative overflow-hidden group flex flex-col justify-between px-4 py-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4FF0E6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide flex items-center gap-1">
                                    Cartel 24h Revenue
                                </div>
                                <div className="text-2xl font-black text-[#4FF0E6]">$12.50</div>
                            </div>
                            <div className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">📊</div>
                        </div>
                    </StatCard>
                </div>
            </div>
        </div>
    );
}
