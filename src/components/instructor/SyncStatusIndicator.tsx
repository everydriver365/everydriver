import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface SyncStatusIndicatorProps {
  instructorId: string | undefined;
}

export function SyncStatusIndicator({ instructorId }: SyncStatusIndicatorProps) {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync({ instructorId });
  const [expanded, setExpanded] = useState(false);

  // Don't show if online with nothing pending and not syncing
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        onClick={() => setExpanded(!expanded)}
        className={`relative h-8 rounded-full flex items-center gap-1.5 px-2.5 transition-colors ${
          !isOnline
            ? "bg-destructive/20 text-destructive"
            : isSyncing
            ? "bg-amber-500/20 text-amber-600"
            : "bg-emerald-500/20 text-emerald-600"
        }`}
      >
        {!isOnline ? (
          <CloudOff className="h-3.5 w-3.5" />
        ) : isSyncing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Cloud className="h-3.5 w-3.5" />
        )}

        {pendingCount > 0 && (
          <span className="text-[10px] font-bold">{pendingCount}</span>
        )}

        {/* Pulse dot for pending */}
        {pendingCount > 0 && !isSyncing && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </motion.button>

      {/* Expanded tooltip */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-2xl shadow-lg p-3 z-50"
        >
          <p className="text-xs font-medium text-foreground mb-1">
            {!isOnline ? "You're offline" : isSyncing ? "Syncing..." : "Sync Status"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} change${pendingCount > 1 ? "s" : ""} waiting to sync`
              : "Everything is up to date"}
          </p>
          {!isOnline && pendingCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Changes will sync when you're back online
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
