import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "~/components/ui/LoadingScreen";

// ... imports ...

export default function App() {
  // ... hooks ...

  // ... useEffect ...

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
