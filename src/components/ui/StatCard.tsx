"use client";

import { motion, Variants } from "framer-motion";

export const statCardVariants: Variants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

interface StatCardProps {
    children: React.ReactNode;
    className?: string;
}

export function StatCard({ children, className = "" }: StatCardProps) {
    return (
        <motion.div
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl bg-[#13161F] border border-white/5 p-3 shadow-lg backdrop-blur-sm ${className}`}
        >
            {children}
        </motion.div>
    );
}
