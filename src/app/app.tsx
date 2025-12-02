"use client";

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import JoinCartel from "~/components/JoinCartel";
import CartelDashboard from "~/components/CartelDashboard";
import Leaderboard from "~/components/Leaderboard";
import { Button } from "~/components/ui/button";
import { CARTEL_SHARES_ADDRESS } from "~/lib/basePay";
import { useFrameContext } from "~/components/providers/FrameProvider";

const SHARES_ABI = [
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id", type: "uint256" }
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export default function App() {
  const { address, isConnected } = useAccount();
  const frameContext = useFrameContext();
  const { isInMiniApp } = frameContext || {};

  const [hasJoined, setHasJoined] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "leaderboard">("dashboard");
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check if user has shares (ID 1)
  const { data: shareBalance, isLoading: isBalanceLoading } = useReadContract({
    address: CARTEL_SHARES_ADDRESS as `0x${string}`,
    abi: SHARES_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(1)] : undefined,
    query: {
      enabled: !!address,
    }
  });

  useEffect(() => {
    // If connected, wait for balance check
    if (isConnected) {
      if (!isBalanceLoading && shareBalance !== undefined) {
        if (shareBalance > BigInt(0)) {
          setHasJoined(true);
        }
        setIsCheckingStatus(false);
      }
    } else {
      // If not connected
      if (isInMiniApp) {
        // In MiniApp, wait for auto-connect (handled in JoinCartel or implicitly)
        // But we can't wait forever here without feedback.
        // Let's allow JoinCartel to render, it handles the "Connecting..." UI.
        setIsCheckingStatus(false);
      } else {
        // Not in MiniApp, ready to show Join screen
        setIsCheckingStatus(false);
      }
    }
  }, [isConnected, shareBalance, isBalanceLoading, isInMiniApp]);

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-[#0B0E12] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl animate-bounce">🎩</div>
          <p className="text-neon-blue font-bold animate-pulse">Loading Cartel Data...</p>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return <JoinCartel onJoin={(inviteCode) => {
      console.log("Joining with invite:", inviteCode);
      setHasJoined(true);
    }} />;
  }

  return (
    <div className="pb-20">
      {currentView === "dashboard" ? <CartelDashboard /> : <Leaderboard />}

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
    </div>
  );
}
