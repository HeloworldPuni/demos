"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface ActionButtonProps extends HTMLMotionProps<"button"> {
    label?: string;
    variant: "raid" | "invite" | "betray" | "clan";
    children: React.ReactNode;
}

export function ActionButton({ label, variant, children, className = "", ...props }: ActionButtonProps) {
    const baseClasses =
        "flex-1 rounded-xl py-3 text-sm font-semibold text-center border flex flex-col gap-2 items-center justify-center transition-all duration-300";

    const colors =
        variant === "raid"
            ? "bg-[#FF3B30]/5 border-[#FF3B30]/40 text-white hover:bg-[#FF3B30]/20 hover:border-[#FF3B30]"
            : variant === "invite"
                ? "bg-[#4FF0E6]/5 border-[#4FF0E6]/40 text-white hover:bg-[#4FF0E6]/20 hover:border-[#4FF0E6]"
                : variant === "betray"
                    ? "bg-[#FF3B30]/10 border-[#FF3B30]/60 text-white hover:bg-[#FF3B30]/30 hover:border-[#FF3B30] hover:glow-red"
                    : "bg-[#4A87FF]/5 border-[#4A87FF]/40 text-white hover:bg-[#4A87FF]/20 hover:border-[#4A87FF]"; // clan

    const hoverAnim =
        variant === "raid"
            ? { scale: 1.03, x: [0, -2, 2, 0] } // slight shake
            : { scale: 1.03 };

    return (
        <motion.button
            className={`${baseClasses} ${colors} ${className}`}
            whileHover={hoverAnim}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            {children}
        </motion.button>
    );
}
