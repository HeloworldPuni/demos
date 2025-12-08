"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import JoinCartel from "@/components/JoinCartel";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function App() {
  const { address, isConnected } = useAccount();
  const [hasJoined, setHasJoined] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (!address) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        // Simulate checking if user is in cartel
        // In a real app, this would be an API call
        const storedJoinStatus = localStorage.getItem(`cartel_joined_${address}`);
        if (storedJoinStatus === 'true') {
          setHasJoined(true);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Failed to check status:", error);
      } finally {
        setTimeout(() => setIsCheckingStatus(false), 1500);
      }
    };

    if (isMounted) {
      checkStatus();
    }
  }, [address, isMounted, router]);

  if (!isMounted) return null;

  if (!isConnected) {
    return (
      <JoinCartel onJoin={(inviteCode) => {
        console.log("Joined!", inviteCode);
        if (address) {
          localStorage.setItem(`cartel_joined_${address}`, 'true');
        }
        setHasJoined(true);
        router.push('/dashboard');
      }} />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isCheckingStatus ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingScreen />
        </motion.div>
      ) : !hasJoined ? (
        <motion.div
          key="join"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <JoinCartel onJoin={(inviteCode) => {
            console.log("Joined!", inviteCode);
            if (address) {
              localStorage.setItem(`cartel_joined_${address}`, 'true');
            }
            setHasJoined(true);
            router.push('/dashboard');
          }} />
        </motion.div>
      ) : (
        // Fallback if router push handles it but component still renders momentarily
        <LoadingScreen />
      )}
    </AnimatePresence>
  );
}
