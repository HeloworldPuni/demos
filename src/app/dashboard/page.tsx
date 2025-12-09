"use client";

import { useAccount } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import CartelDashboard from '@/components/CartelDashboard';
import { motion } from "framer-motion";
import { fadeUp } from "@/components/motion/variants";

export default function DashboardPage() {
    const { address } = useAccount();
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <CartelDashboard address={address} />
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
