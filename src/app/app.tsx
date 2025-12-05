"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import CartelDashboard from "@/components/CartelDashboard";
import Leaderboard from "@/components/Leaderboard";
import JoinCartel from "@/components/JoinCartel";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function App() {
  const { address, isConnected } = useAccount();
  const [hasJoined, setHasJoined] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [currentView, setCurrentView] = useState<"dashboard" | "leaderboard">("dashboard");

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
        }
      } catch (error) {
        console.error("Failed to check status:", error);
      } finally {
        // Add a small delay for the loading animation to be visible
        setTimeout(() => setIsCheckingStatus(false), 1500);
      }
    };

    checkStatus();
  }, [address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-500">BASE CARTEL</h1>
        <p className="text-zinc-400">Connect your wallet to enter the underworld.</p>
      </div>
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
            console.log("Joining with invite:", inviteCode);
            if (address) {
              localStorage.setItem(`cartel_joined_${address}`, 'true');
            }
            setHasJoined(true);
          }} />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pb-20"
        >
          {currentView === "dashboard" ? <CartelDashboard address={address} /> : <Leaderboard />}

          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 flex justify-around z-50">
            <Button
              variant={currentView === "dashboard" ? "default" : "ghost"}
              onClick={() => setCurrentView("dashboard")}
              className="w-32"
            >
              🏠 Base
            </Button>
            <Button
              variant={currentView === "leaderboard" ? "default" : "ghost"}
              onClick={() => setCurrentView("leaderboard")}
              className="w-32"
            >
              🏆 Rank
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
