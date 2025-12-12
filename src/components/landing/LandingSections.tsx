
"use client";

import { motion, Variants } from "framer-motion";
import { LANDING_CONTENT } from "./landing-config";
import Link from "next/link";
import { IconX, IconBase, IconFarcaster } from "@/components/icons/SocialIcons";
import {
    Wallet,
    ConnectWallet,
    WalletDropdown,
    WalletDropdownDisconnect,
    WalletDropdownLink
} from '@coinbase/onchainkit/wallet';
import {
    Avatar,
    Name,
    Identity,
    Address,
    EthBalance
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';


const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

export function LandingHero() {
    const { isConnected } = useAccount();
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden px-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] delay-1000 animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
                <motion.div variants={fadeInUp} className="scale-150 mb-4">
                    <span className="text-6xl md:text-8xl drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]">🎩</span>
                </motion.div>

                <motion.h1
                    variants={fadeInUp}
                    className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-2xl"
                >
                    {LANDING_CONTENT.hero.title}
                </motion.h1>

                <motion.p
                    variants={fadeInUp}
                    className="text-lg md:text-2xl text-zinc-400 max-w-xl font-light tracking-wide"
                >
                    {LANDING_CONTENT.hero.subtitle}
                </motion.p>

                <div className="mt-8">
                    {isConnected ? (
                        <Link href="/dashboard" className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-block">
                            <span className="relative z-10">{LANDING_CONTENT.hero.cta}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3DFF72] to-[#4FF0E6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                    ) : (
                        <Wallet>
                            <ConnectWallet className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] border-none">
                                <span className="relative z-10">{LANDING_CONTENT.hero.cta}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#3DFF72] to-[#4FF0E6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </ConnectWallet>
                        </Wallet>
                    )}
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 2, duration: 1.5, repeat: Infinity }}
                className="absolute bottom-10 text-zinc-600 text-sm tracking-widest uppercase"
            >
                Scroll to Explore
            </motion.div>
        </section>
    );
}

export function FeaturesGrid() {
    return (
        <section className="py-24 px-4 bg-[#0B0E12]/50 relative">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {LANDING_CONTENT.features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeInUp}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="p-8 rounded-3xl bg-[#13161F] border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl -mr-8 -mt-8 ${feature.color} blur-sm`}>
                                {feature.icon}
                            </div>

                            <div className="relative z-10">
                                <div className={`text-5xl mb-6 ${feature.title === "Raid Rivals" ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" : ""}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">{feature.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export function HowItWorks() {
    const stepIcons = ["👑", "⚔️", "💰"];

    return (
        <section className="py-24 px-4 bg-gradient-to-b from-[#0B0E12] to-black">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4">HOW IT WORKS</h2>
                <div className="h-1 w-24 bg-[#3DFF72] mx-auto rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

                {LANDING_CONTENT.howItWorks.map((step, idx) => (
                    <motion.div
                        key={idx}
                        // Float Animation
                        animate={{ y: [-3, 3] }}
                        transition={{
                            y: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: idx * 0.5 }
                        }}
                        className="flex flex-col items-center text-center relative z-10"
                    >
                        {/* Step Card */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#171A1F] to-[#0D0F12] border border-zinc-700/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center relative mb-8 overflow-hidden group"
                        >
                            {/* Outer Glow */}
                            <div className="absolute inset-0 rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.3)] opacity-50 group-hover:opacity-100 transition-opacity" />

                            {/* Watermark Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 text-6xl select-none pointer-events-none scale-150">
                                {stepIcons[idx]}
                            </div>

                            {/* Big Number */}
                            <motion.span
                                whileHover={{ scale: 1.2 }}
                                className="relative z-10 text-4xl font-black text-zinc-400 group-hover:text-[#3DFF72] transition-colors"
                            >
                                {idx + 1}
                            </motion.span>
                        </motion.div>

                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{step.title}</h3>
                        <p className="text-zinc-500 text-sm max-w-xs">{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

export function GameplayShowcase() {
    const screens = [
        { label: "Dashboard Preview", id: 1 },
        { label: "Raid Screen Preview", id: 2 },
        { label: "Clan Preview", id: 3 },
        { label: "Earnings Preview", id: 4 },
    ];

    return (
        <section className="py-24 px-4 bg-zinc-950/30">
            <div className="max-w-6xl mx-auto text-center mb-12">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Interface</h2>
                <h3 className="text-3xl font-bold text-white">PROVEN GAME LOOP</h3>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                {screens.map((screen) => {
                    let imgSrc = "";
                    switch (screen.id) {
                        case 1: imgSrc = "/img/dashboard_preview.png"; break;
                        case 2: imgSrc = "/img/raid_preview.png"; break;
                        case 3: imgSrc = "/img/clan_preview.png"; break;
                        case 4: imgSrc = "/img/earnings_preview.png"; break;
                        default: imgSrc = "/img/dashboard_preview.png";
                    }

                    return (
                        <div key={screen.id} className="flex flex-col gap-3">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="aspect-[9/19] rounded-xl relative overflow-hidden group shadow-[0_0_30px_rgba(0,102,255,0.2)] bg-zinc-900 border border-zinc-800"
                            >
                                <img
                                    src={imgSrc}
                                    alt={screen.label}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <span className="text-white/20 font-bold uppercase tracking-widest text-lg rotate-[-15deg] border-2 border-white/10 px-4 py-2 rounded-xl">
                                        Live Preview
                                    </span>
                                </div>
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 z-30 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 z-30 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 z-30 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 z-30 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                            <div className="text-center">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium group-hover:text-white transition-colors">
                                    {screen.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function LandingFooter() {
    return (
        <footer className="py-12 border-t border-white/5 bg-zinc-950/50 text-center">
            <div className="mb-8">
                <span className="text-2xl">🎩</span>
            </div>
            <div className="flex justify-center gap-8 mb-8">
                <a href="#" className="text-zinc-500 hover:text-white hover:scale-110 transition-all duration-300">
                    <IconX className="w-5 h-5" />
                </a>
                <a href="#" className="text-zinc-500 hover:text-[#0052FF] hover:scale-110 transition-all duration-300">
                    <IconBase className="w-6 h-6" />
                </a>
                <a href="#" className="text-zinc-500 hover:text-[#855DCD] hover:scale-110 transition-all duration-300">
                    <IconFarcaster className="w-6 h-6" />
                </a>
            </div>
            <p className="text-xs text-zinc-700">© 2025 Base Cartel. All rights reserved.</p>
        </footer>
    )
}




export function LandingHeader() {
    const { address } = useAccount();

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center bg-gradient-to-b from-[#0B0E12] to-transparent pointer-events-none">
            {/* Logo / Brand (optional) */}
            <div className="pointer-events-auto">
                {/* Empty left side for balance */}
            </div>

            {/* Wallet */}
            <div className="pointer-events-auto">
                {address && (
                    <Wallet>
                        <WalletDropdown>
                            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                                <Avatar />
                                <Name />
                                <Address />
                                <EthBalance />
                            </Identity>
                            <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
                                Wallet
                            </WalletDropdownLink>
                            <WalletDropdownDisconnect />
                        </WalletDropdown>
                    </Wallet>
                )}
            </div>
        </header>
    );
}
