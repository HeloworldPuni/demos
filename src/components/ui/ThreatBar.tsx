import { motion } from "framer-motion";

interface ThreatBarProps {
    score: number;
}

export function ThreatBar({ score }: ThreatBarProps) {
    const widthPercentage = Math.min(score, 100);
    const color =
        score > 80 ? "bg-red-500" : score > 50 ? "bg-orange-500" : "bg-yellow-500";

    return (
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${color}`}
            />
        </div>
    );
}
