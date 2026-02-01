import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

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
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Color based on progress
  const getProgressColor = () => {
    if (progressPercent >= 100) return "stroke-emerald-500";
    if (progressPercent >= 75) return "stroke-blue-500";
    if (progressPercent >= 50) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg width="100" height="100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getProgressColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{hoursThisWeek}h</span>
        <span className="text-[10px] text-muted-foreground">of {hoursGoal}h</span>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-1 mt-2">
        {isAheadOfLastWeek ? (
          <>
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Ahead of last week
            </span>
          </>
        ) : (
          <>
            <TrendingDown className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Behind last week
            </span>
          </>
        )}
      </div>
    </div>
  );
}
