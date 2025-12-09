"use client";

import { motion, Variants } from "framer-motion";
import { LANDING_CONTENT, LANDING_THEME } from "./landing-config";
import Link from "next/link";

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
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden px-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] delay-1000 animate-pulse" />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="relative z-10 flex flex-col items-center gap-6 max-w-4xl"
            >
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

                <motion.div variants={fadeInUp} className="mt-8">
                    <Link href="/dashboard" className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        <span className="relative z-10">{LANDING_CONTENT.hero.cta}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#3DFF72] to-[#4FF0E6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                </motion.div>
            </motion.div>

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
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                        className="flex flex-col items-center text-center relative z-10"
                    >
                        <div className="w-24 h-24 rounded-2xl bg-[#1A1D26] border border-zinc-800 flex items-center justify-center text-3xl font-black text-zinc-500 mb-6 shadow-xl relative group">
                            <span className="group-hover:text-[#3DFF72] transition-colors">{idx + 1}</span>
                            <div className="absolute inset-0 bg-[#3DFF72]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-zinc-500 text-sm">{step.desc}</p>
                    </motion.div>
                ))}
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
            <div className="flex justify-center gap-8 mb-8 text-sm text-zinc-500 font-mono uppercase tracking-widest">
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <Link href="/leaderboard" className="hover:text-white transition-colors">Ranking</Link>
                <a href="https://github.com/heloworldpuni/demos" target="_blank" className="hover:text-white transition-colors">Code</a>
            </div>
            <p className="text-xs text-zinc-700">© 2025 Base Cartel. All rights reserved.</p>
        </footer>
    )
}
