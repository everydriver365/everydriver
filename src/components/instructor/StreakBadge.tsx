import { motion } from "framer-motion";
import { Flame, Trophy, Star } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  isActiveToday: boolean;
  className?: string;
}

export function StreakBadge({
  currentStreak,
  isActiveToday,
  className = "",
}: StreakBadgeProps) {
  if (currentStreak < 2) return null;

  // Determine badge tier
  const getBadgeTier = () => {
    if (currentStreak >= 30) return { icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/15", label: "Legend" };
    if (currentStreak >= 14) return { icon: Star, color: "text-purple-500", bg: "bg-purple-500/15", label: "Pro" };
    if (currentStreak >= 7) return { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/15", label: "On Fire" };
    return { icon: Flame, color: "text-rose-500", bg: "bg-rose-500/15", label: "Streak" };
  };

  const tier = getBadgeTier();
  const Icon = tier.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tier.bg} ${className}`}
    >
      <motion.div
        animate={isActiveToday ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Icon className={`h-3.5 w-3.5 ${tier.color}`} />
      </motion.div>
      <span className={`text-xs font-bold ${tier.color}`}>
        {currentStreak} day{currentStreak !== 1 ? "s" : ""}
      </span>
    </motion.div>
  );
}
