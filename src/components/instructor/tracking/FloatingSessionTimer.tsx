import { motion, AnimatePresence } from "framer-motion";
import { Clock, Route, Square, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FloatingSessionTimerProps {
  elapsedSeconds: number;
  distanceMiles: number;
  pupilName: string | null;
  isTestRoute: boolean;
  onStop: () => void;
  isStopping: boolean;
  /** Live speed in mph (rounded). Null if no recent fix. */
  speedMph?: number | null;
  /** Posted limit in mph (rounded). Null if unknown. */
  speedLimitMph?: number | null;
  /** True when no movement detected for the configured idle window. */
  paused?: boolean;
  /** Called when instructor taps Resume — clears the paused-overlay (no backend change). */
  onResume?: () => void;
  /** Optional alert count badge inside the panel. */
  alertCount?: number;
}

export function FloatingSessionTimer({
  elapsedSeconds,
  distanceMiles,
  pupilName,
  isTestRoute,
  onStop,
  isStopping,
  speedMph = null,
  speedLimitMph = null,
  paused = false,
  onResume,
  alertCount = 0,
}: FloatingSessionTimerProps) {
  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isOver = !paused && speedMph != null && speedLimitMph != null && speedMph > speedLimitMph;
  const speedColor = paused ? "#71717A" : isOver ? "#DC2626" : "#1c1c1e";

  return (
    <motion.div
      className="fixed bottom-4 left-3 right-3 z-40"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
    >
      <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border overflow-hidden">
        {/* Top row: status + pupil + alert chip */}
        <div className="flex items-center gap-2 px-4 pt-3">
          <AnimatePresence mode="wait" initial={false}>
            {paused ? (
              <motion.div
                key="paused"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Paused
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="rec"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  REC
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="text-[13px] font-semibold text-foreground truncate min-w-0 flex-1">
            {pupilName || (isTestRoute ? "Test route" : "Lesson")}
          </span>

          {alertCount > 0 && (
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-red-500/10 text-red-600 text-[10px] font-semibold px-2 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              {alertCount}
            </span>
          )}
        </div>

        {/* Middle row: BIG speed + limit pill */}
        <div className="flex items-end justify-between gap-3 px-4 pt-1.5 pb-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <motion.span
              key={speedMph ?? "—"}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[44px] leading-none font-bold tabular-nums tracking-tight"
              style={{ color: speedColor }}
            >
              {paused ? 0 : speedMph != null ? speedMph : "—"}
            </motion.span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              mph
            </span>
          </div>

          {speedLimitMph != null && (
            <div
              className="flex items-center justify-center rounded-full bg-white shrink-0"
              style={{
                width: 56,
                height: 56,
                border: "6px solid #C8102E", // UK road-sign red
                boxShadow: isOver
                  ? "0 0 0 2px rgba(220,38,38,0.35)"
                  : "0 1px 2px rgba(0,0,0,0.15)",
              }}
              aria-label={`Speed limit ${speedLimitMph} mph`}
              role="img"
            >
              <span
                className="font-bold tabular-nums text-black leading-none"
                style={{
                  fontSize: speedLimitMph >= 100 ? 16 : 20,
                  fontFamily:
                    '"Transport", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  letterSpacing: -0.5,
                }}
              >
                {speedLimitMph}
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: stats + actions */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border/60 mt-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[15px] font-bold text-foreground tabular-nums">
              {formatElapsedTime(elapsedSeconds)}
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5 shrink-0">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[15px] font-bold text-foreground tabular-nums">
              {distanceMiles.toFixed(1)}
              <span className="text-[11px] font-normal text-muted-foreground ml-0.5">
                mi
              </span>
            </span>
          </div>

          <div className="flex-1" />

          <AnimatePresence mode="popLayout" initial={false}>
            {paused && onResume && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-2xl font-semibold text-xs bg-[#1c1c1e] hover:bg-[#1c1c1e]/90 text-white"
                  onClick={onResume}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Resume
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="destructive"
            size="sm"
            className="h-9 px-4 rounded-2xl font-semibold text-xs shrink-0"
            onClick={onStop}
            disabled={isStopping}
          >
            {isStopping ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Square className="h-3.5 w-3.5 mr-1" />
                End
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
