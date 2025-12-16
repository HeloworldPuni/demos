"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import Leaderboard from '@/components/Leaderboard';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function LeaderboardPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div {...motionPage}>
                    <ErrorBoundary>
                        <Leaderboard />
                    </ErrorBoundary>
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
