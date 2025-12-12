"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from 'wagmi';

import JoinCartel from "@/components/JoinCartel";

export default function LoginPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();

    useEffect(() => {
        if (isConnected) {
            router.push('/dashboard');
        }
    }, [isConnected, router]);

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] delay-1000 animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 text-center p-4">
                <div className="scale-150 mb-4 animate-bounce">
                    <span className="text-6xl md:text-8xl drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]">🎩</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-2xl">
                    CONNECT WALLET
                </h1>

                <div className="scale-150 p-4">
                    <Wallet>
                        <ConnectWallet className="px-8 py-4 bg-white text-black font-black text-xl rounded-full" />
                    </Wallet>
                </div>
            </div>
        </main>
    );
}
