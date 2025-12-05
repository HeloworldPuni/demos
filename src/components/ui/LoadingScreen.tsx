import { motion } from "framer-motion";

const hatVariants = {
    initial: { y: 0, opacity: 0 },
    animate: {
        y: [0, -10, 0],
        opacity: 1,
        transition: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

const textVariants = {
    initial: { opacity: 0 },
    animate: {
        opacity: [0.4, 1, 0.4],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

export function LoadingScreen() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#05060a]">
            <motion.div
                variants={hatVariants}
                initial="initial"
                animate="animate"
                className="mb-4"
            >
                <span style={{ fontSize: 72 }}>🎩</span>
            </motion.div>

            <motion.div
                variants={textVariants}
                initial="initial"
                animate="animate"
                className="text-base font-medium text-blue-400 tracking-wide"
            >
                Loading Cartel Data…
            </motion.div>
        </div>
    );
}
