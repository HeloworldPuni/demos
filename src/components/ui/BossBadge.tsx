"use client";

import { motion, Variants } from "framer-motion";

const badgeVariants: Variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        boxShadow: [
            "0 0 8px rgba(250,204,21,0.3)",
            "0 0 16px rgba(250,204,21,0.7)",
            "0 0 8px rgba(250,204,21,0.3)",
        ],
        transition: {
            scale: { duration: 0.35, ease: "easeOut" },
            opacity: { duration: 0.35, ease: "easeOut" },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
    },
};

interface BossBadgeProps {
    title: string;
}

export function BossBadge({ title }: BossBadgeProps) {
    return (
        <motion.div
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            className="px-3 py-1 rounded-full border border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.4)] text-[#D4AF37] text-xs font-bold uppercase tracking-wider flex items-center gap-1"
        >
            ⭐ {title}
        </motion.div>
    );
}
