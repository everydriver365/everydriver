import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface WeeklyGoalRingProps {
  hoursThisWeek: number;
  hoursGoal: number;
  progressPercent: number;
  isAheadOfLastWeek: boolean;
  className?: string;
}

export function WeeklyGoalRing({
  hoursThisWeek,
  hoursGoal,
  progressPercent,
  isAheadOfLastWeek,
  className = "",
}: WeeklyGoalRingProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const radius = 20;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(progressPercent, 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Trigger confetti on 100% completion
  useEffect(() => {
    if (progressPercent >= 100 && !hasTriggeredConfetti) {
      const today = new Date().toDateString();
      const lastConfetti = localStorage.getItem("weekly-goal-confetti");
      if (lastConfetti !== today) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b"],
        });
        localStorage.setItem("weekly-goal-confetti", today);
        setHasTriggeredConfetti(true);
      }
    }
  }, [progressPercent, hasTriggeredConfetti]);

  // Gradient colors based on progress — iOS Health style
  const getGradientColors = () => {
    if (progressPercent >= 100) return { start: "#22c55e", end: "#06b6d4" }; // green→cyan
    if (progressPercent >= 60) return { start: "#eab308", end: "#22c55e" }; // yellow→green
    return { start: "#ef4444", end: "#f97316" }; // red→orange
  };

  const gradientColors = getGradientColors();
  const gradientId = `weeklyGoalGradient-${progressPercent}`;
  const glowId = `weeklyGoalGlow-${progressPercent}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-14 h-14">
        <svg width="56" height="56" className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <motion.circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            stroke={`url(#${gradientId})`}
            filter={`url(#${glowId})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
          
          {progressPercent >= 100 && (
            <motion.circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              strokeWidth={strokeWidth + 2}
              strokeLinecap="round"
              stroke="white"
              opacity="0.3"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: [circumference, 0, circumference] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ strokeDasharray: `${circumference * 0.1} ${circumference * 0.9}` }}
            />
          )}
        </svg>
        
        {/* Center content - positioned within SVG container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {progressPercent >= 100 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5"
            >
              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Done!</span>
            </motion.div>
          ) : (
            <>
              <span className="text-[11px] font-bold leading-none text-primary">{hoursThisWeek}h</span>
              <span className="text-[7px] leading-tight text-muted-foreground">of {hoursGoal}h</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 mt-0.5">
        {isAheadOfLastWeek ? (
          <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
        ) : (
          <TrendingDown className="h-2.5 w-2.5 text-amber-500" />
        )}
      </div>
    </div>
  );
}
