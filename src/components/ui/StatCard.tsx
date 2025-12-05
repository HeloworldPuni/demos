import { motion } from "framer-motion";

export const statCardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
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
            className={`rounded-2xl bg-[#111323] border border-white/5 p-4 ${className}`}
        >
            {children}
        </motion.div>
    );
}
