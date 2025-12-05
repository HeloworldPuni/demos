import { motion } from "framer-motion";

interface ClaimButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

export function ClaimButton({ onClick, disabled, children }: ClaimButtonProps) {
    return (
        <motion.button
            disabled={disabled}
            onClick={onClick}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-400 text-black shadow-lg shadow-emerald-500/40 disabled:opacity-50"
            whileHover={!disabled ? { scale: 1.03 } : undefined}
            whileTap={!disabled ? { scale: 0.97 } : undefined}
            animate={{
                boxShadow: disabled
                    ? "0 0 0 rgba(16,185,129,0)"
                    : [
                        "0 0 14px rgba(16,185,129,0.4)",
                        "0 0 24px rgba(16,185,129,0.9)",
                        "0 0 14px rgba(16,185,129,0.4)",
                    ],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {children}
        </motion.button>
    );
}
