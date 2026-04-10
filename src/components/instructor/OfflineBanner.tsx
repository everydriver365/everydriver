import { useState, useEffect } from "react";
import { WifiOff, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  // Auto-dismiss offline banner after 5 seconds
  useEffect(() => {
    if (!isOnline && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, dismissed]);

  if (dismissed && !showReconnected) return null;

  return (
    <AnimatePresence>
      {!isOnline && !dismissed && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-[calc(env(safe-area-inset-top)+60px)] left-4 right-4 z-50"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-none bg-amber-50 dark:bg-amber-950/80 shadow-lg ring-1 ring-amber-500/30 backdrop-blur-xl">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
                You're offline
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70">
                Showing saved data. Changes will sync when back online.
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 p-1 rounded-full hover:bg-amber-500/20"
            >
              <X className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-[calc(env(safe-area-inset-top)+60px)] left-4 right-4 z-50"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-none bg-emerald-50 dark:bg-emerald-950/80 shadow-lg ring-1 ring-emerald-500/30 backdrop-blur-xl">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
              Back online — syncing your changes...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
