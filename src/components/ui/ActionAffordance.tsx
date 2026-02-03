import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionAffordanceProps {
  type?: "more" | "chevron" | "info";
  showHint?: boolean;
  hintKey?: string; // localStorage key to track if hint was seen
  className?: string;
}

export function ActionAffordance({
  type = "chevron",
  showHint = false,
  hintKey,
  className,
}: ActionAffordanceProps) {
  const [hasSeenHint, setHasSeenHint] = useState(true);

  useEffect(() => {
    if (hintKey) {
      const seen = localStorage.getItem(`hint-${hintKey}`);
      setHasSeenHint(!!seen);
    }
  }, [hintKey]);

  const markAsSeen = () => {
    if (hintKey) {
      localStorage.setItem(`hint-${hintKey}`, "true");
      setHasSeenHint(true);
    }
  };

  const Icon = type === "more" ? MoreVertical : type === "info" ? Info : ChevronRight;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Icon className="h-4 w-4 text-muted-foreground" />
      
      {/* Pulse hint for first-time users */}
      <AnimatePresence>
        {showHint && !hasSeenHint && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            onClick={markAsSeen}
          >
            <motion.div
              className="absolute w-8 h-8 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Swipe hint shimmer effect
interface SwipeHintProps {
  direction?: "left" | "right";
  show?: boolean;
  hintKey?: string;
  children: ReactNode;
}

export function SwipeHint({ direction = "right", show = true, hintKey, children }: SwipeHintProps) {
  const [hasSeenHint, setHasSeenHint] = useState(true);

  useEffect(() => {
    if (hintKey) {
      const seen = localStorage.getItem(`swipe-hint-${hintKey}`);
      setHasSeenHint(!!seen);
    } else {
      setHasSeenHint(false);
    }
  }, [hintKey]);

  const markAsSeen = () => {
    if (hintKey) {
      localStorage.setItem(`swipe-hint-${hintKey}`, "true");
      setHasSeenHint(true);
    }
  };

  if (!show || hasSeenHint) return <>{children}</>;

  return (
    <div className="relative" onTouchStart={markAsSeen} onMouseDown={markAsSeen}>
      {children}
      {/* Shimmer effect */}
      <motion.div
        className={cn(
          "absolute inset-y-0 w-12 pointer-events-none",
          direction === "right" ? "left-0" : "right-0"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{
          duration: 2,
          repeat: 3,
          repeatDelay: 1,
        }}
      >
        <div
          className={cn(
            "h-full w-full",
            "bg-gradient-to-r",
            direction === "right"
              ? "from-primary/30 via-primary/10 to-transparent"
              : "from-transparent via-primary/10 to-primary/30"
          )}
        />
      </motion.div>
    </div>
  );
}

// Long-press indicator
interface LongPressIndicatorProps {
  progress: number; // 0-1
  show: boolean;
}

export function LongPressIndicator({ progress, show }: LongPressIndicatorProps) {
  return (
    <AnimatePresence>
      {show && progress > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/30"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress }}
              style={{
                strokeDasharray: "100 100",
              }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
