import { useAccount, useReadContract } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import CartelDashboard from '@/components/CartelDashboard';
import JoinCartel from '@/components/JoinCartel';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";
import CartelSharesABI from '@/lib/abi/CartelShares.json';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const { address } = useAccount();
    const [justJoined, setJustJoined] = useState(false);

    // CRITICAL: Check membership on chain.
    // If user is connected but has 0 shares, they are NOT a member yet (Zombie State or New).
    // The Dashboard should only be visible to actual shareholders.
    const sharesAddress = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    const { data: shareBalance, refetch, isError, isLoading } = useReadContract({
        address: sharesAddress,
        abi: CartelSharesABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`, 1n],
        query: {
            enabled: !!address && !!sharesAddress,
            staleTime: 5000 // Refresh often
        }
    });

    const isMember = shareBalance && Number(shareBalance) > 0;

    // If loading or just joined, assume member to prevent flash
    // If error, maybe network issue? safe to show dashboard or error? 
    // Let's safe-fail to Join screen if we definitively know shares == 0.

    const showJoin = !isLoading && !isMember && !justJoined;

    return (
        <AuthenticatedRoute>
            {showJoin ? (
                <JoinCartel onJoin={() => {
                    setJustJoined(true);
                    refetch(); // Update balance
                }} />
            ) : (
                <AppLayout>
                    <motion.div {...motionPage}>
                        <CartelDashboard address={address} />
                    </motion.div>
                </AppLayout>
            )}
        </AuthenticatedRoute>
    );
}
