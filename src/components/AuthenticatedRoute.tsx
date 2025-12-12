"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from "@/components/ui/LoadingScreen";
export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Wait a bit for wagmi to initialize
        const timer = setTimeout(() => {
            if (!isConnected) {
                router.push('/login');
            }
            setIsChecking(false);
        }, 1000); // 1s grace period for connection check

        return () => clearTimeout(timer);
    }, [isConnected, router]);

    if (isChecking) {
        return <LoadingScreen />;
    }

    if (!isConnected) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
