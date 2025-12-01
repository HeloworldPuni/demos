"use client";

// import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';

import JoinCartel from "~/components/JoinCartel";
import CartelDashboard from "~/components/CartelDashboard";
import Leaderboard from "~/components/Leaderboard";
import { Button } from "~/components/ui/button";

export default function App() {
  // const { isFrameReady, setFrameReady } = useMiniKit();
  const [hasJoined, setHasJoined] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "leaderboard">("dashboard");

  // Initialize the miniapp
  // useEffect(() => {
  //   if (!isFrameReady) {
  //     setFrameReady();
  //   }
  // }, [setFrameReady, isFrameReady]);

  // if (!isFrameReady) {
  //   return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>;
  // }

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
