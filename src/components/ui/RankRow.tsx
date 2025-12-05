import { motion } from "framer-motion";

interface RankRowProps {
    children: React.ReactNode;
    index: number;
    className?: string;
}

export function RankRow({ children, index, className = "" }: RankRowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
            className={`rounded-lg transition-colors ${className}`}
        >
            {children}
        </motion.div>
    );
}
