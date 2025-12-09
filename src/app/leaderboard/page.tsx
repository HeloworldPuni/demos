"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import Leaderboard from '@/components/Leaderboard';
import { motion } from "framer-motion";
import { fadeUp } from "@/components/motion/variants";

export default function LeaderboardPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <Leaderboard />
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
