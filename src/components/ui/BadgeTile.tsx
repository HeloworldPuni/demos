import { motion } from "framer-motion";

interface BadgeTileProps {
    unlocked: boolean;
    children: React.ReactNode;
}

export function BadgeTile({ unlocked, children }: BadgeTileProps) {
    return (
        <motion.div
            initial={{ scale: unlocked ? 0.9 : 1, opacity: unlocked ? 0 : 0.6 }}
            animate={{
                scale: 1,
                opacity: unlocked ? 1 : 0.4,
            }}
            transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className={`rounded-2xl p-3 border ${unlocked ? "border-yellow-300/60 bg-yellow-300/5" : "border-white/5 bg-black/20"
                }`}
            whileHover={unlocked ? { scale: 1.03 } : undefined}
        >
            {children}
        </motion.div>
    );
}
