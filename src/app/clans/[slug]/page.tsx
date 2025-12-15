
"use client";

import { useEffect, useState, use } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Copy, Shield, LogOut, ArrowLeft } from "lucide-react";

// Types
interface ClanDetail {
    id: string;
    slug: string;
    name: string;
    tag: string;
    members: Array<{
        user: {
            walletAddress: string;
            farcasterHandle: string | null;
            rep: number;
        };
        role: string;
        joinedAt: string;
    }>;
    ownerId: string;
}

export default function ClanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { address } = useAccount();
    const router = useRouter();

    const [clan, setClan] = useState<ClanDetail | null>(null);
    const [myMembership, setMyMembership] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    // Load Data
    useEffect(() => {
        const load = async () => {
            if (!address || !slug) return;
            try {
                const res = await fetch(`/api/clans/${slug}`);
                if (!res.ok) throw new Error("Clan unavailable");
                const data = await res.json();
                setClan(data);

                const resMe = await fetch(`/api/me/clan?address=${address}`, {
                    headers: { 'x-wallet-address': address }
                });
                const dataMe = await resMe.json();
                setMyMembership(dataMe ? dataMe.clanId === data.id : false);

            } catch (e) {
                console.error(e);
                router.push('/clans');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [address, slug, router]);

    const handleJoin = async () => {
        if (!address) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/clans/${slug}/join`, {
                method: 'POST', headers: { 'x-wallet-address': address }
            });
            if (res.ok) window.location.reload();
            else setError("Failed to join");
        } catch (e) { setError("Failed to join"); }
        finally { setActionLoading(false); }
    };

    const handleLeave = async () => {
        if (!address) return;
        if (!confirm("Leave this syndicate?")) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/clans/${slug}/leave`, {
                method: 'POST', headers: { 'x-wallet-address': address }
            });
            if (res.ok) router.push('/clans');
            else setError("Failed to leave");
        } catch (e) { setError("Failed to leave"); }
        finally { setActionLoading(false); }
    };

    if (loading || !clan) {
        return (
            <AuthenticatedRoute>
                <AppLayout>
                    <div className="min-h-screen bg-[#0B0E12] flex items-center justify-center text-zinc-500 text-xs font-mono animate-pulse">
                        DECRYPTING SYNDICATE DATA...
                    </div>
                </AppLayout>
            </AuthenticatedRoute>
        );
    }

    const isMember = myMembership;
    // @ts-ignore
    const isOwner = clan.members.find(m => m.user.walletAddress === address)?.role === 'OWNER';

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 pb-32">

                    {/* Header Nav */}
                    <div className="flex items-center gap-2 text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/clans')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Directory</span>
                    </div>

                    {/* HERO BANNER */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#11141D] border border-zinc-800 shadow-2xl">
                        {/* Gradient Background */}
                        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />

                        <div className="p-6 relative z-10 text-center space-y-4">
                            {/* Avatar */}
                            <div className="mx-auto w-24 h-24 rounded-2xl bg-[#0B0E12] border-2 border-zinc-700 flex items-center justify-center shadow-2xl relative">
                                <span className="text-2xl font-black text-white tracking-tighter">{clan.tag}</span>
                                {isMember && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 border-2 border-[#0B0E12] w-6 h-6 rounded-full flex items-center justify-center">
                                        <Shield className="w-3 h-3 text-black fill-current" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase">{clan.name}</h1>
                                <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-widest">Syndicate ID: {clan.slug.toUpperCase()}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex justify-center gap-8 py-2 border-y border-zinc-800/50">
                                <div>
                                    <div className="text-xl font-bold text-white">{clan.members.length}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Members</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-blue-400">#42</div>
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Rank (Beta)</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-center gap-3 pt-2">
                                {isMember ? (
                                    <>
                                        <Button disabled className="bg-zinc-800 text-zinc-400 border border-zinc-700 w-32">
                                            Active
                                        </Button>
                                        {!isOwner && (
                                            <Button
                                                variant="outline"
                                                className="border-red-900/30 text-red-500 hover:bg-red-950/30 hover:text-red-400"
                                                onClick={handleLeave}
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        className="w-full max-w-[200px] bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                        onClick={handleJoin}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "Processing..." : "Join Syndicate"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Member Roster */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Agents</span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">Total Rep: {clan.members.reduce((a, b) => a + b.user.rep, 0)}</span>
                        </div>

                        {clan.members.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#11141D] border border-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 font-mono border border-zinc-700">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-zinc-200 text-xs">
                                                {member.user.farcasterHandle || member.user.walletAddress.slice(0, 6)}
                                            </p>
                                            {member.role === 'OWNER' && <Badge className="text-[8px] h-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-1 py-0">BOSS</Badge>}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Reputation: <span className="text-zinc-300">{member.user.rep}</span></p>
                                    </div>
                                </div>
                                <div className="text-[9px] text-zinc-600 font-mono uppercase">
                                    {new Date(member.joinedAt).toISOString().split('T')[0]}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
