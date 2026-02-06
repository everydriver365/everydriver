import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, PoundSterling, Car, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface QuickStatsChipsProps {
  lessonCount?: number;
  hoursToday?: number;
  expectedEarnings?: number;
  milesDriven?: number;
  averageRating?: number;
  weeklyProgress?: number;
  className?: string;
}

interface StatChip {
  id: string;
  icon: React.ElementType;
  value: string | number;
  label: string;
  route: string;
  color: string;
  bgColor: string;
}

export function QuickStatsChips({
  lessonCount = 0,
  hoursToday = 0,
  expectedEarnings = 0,
  milesDriven,
  averageRating,
  weeklyProgress,
  className,
}: QuickStatsChipsProps) {
  const navigate = useNavigate();

  const chips: StatChip[] = [
    {
      id: "lessons",
      icon: BookOpen,
      value: lessonCount,
      label: "lessons",
      route: "/instructor/schedule",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/15 dark:bg-violet-500/20",
    },
    {
      id: "hours",
      icon: Clock,
      value: `${hoursToday}h`,
      label: "",
      route: "/instructor/schedule",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/15 dark:bg-blue-500/20",
    },
    {
      id: "earnings",
      icon: PoundSterling,
      value: `£${expectedEarnings}`,
      label: "",
      route: "/instructor/earnings",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/15 dark:bg-emerald-500/20",
    },
  ];

  // Add optional chips if values are provided
  if (milesDriven !== undefined && milesDriven > 0) {
    chips.push({
      id: "miles",
      icon: Car,
      value: `${milesDriven}mi`,
      label: "",
      route: "/instructor/traccar",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/15 dark:bg-amber-500/20",
    });
  }

  if (averageRating !== undefined && averageRating > 0) {
    chips.push({
      id: "rating",
      icon: Star,
      value: averageRating.toFixed(1),
      label: "",
      route: "/instructor/reviews",
      color: "text-amber-500",
      bgColor: "bg-amber-500/15 dark:bg-amber-500/20",
    });
  }

  if (weeklyProgress !== undefined) {
    chips.push({
      id: "progress",
      icon: TrendingUp,
      value: `${weeklyProgress}%`,
      label: "goal",
      route: "/instructor/earnings",
      color: weeklyProgress >= 100 
        ? "text-emerald-600 dark:text-emerald-400" 
        : "text-primary",
      bgColor: weeklyProgress >= 100
        ? "bg-emerald-500/15 dark:bg-emerald-500/20"
        : "bg-primary/15",
    });
  }

  const handleChipClick = (route: string) => {
    haptics.selection();
    navigate(route);
  };

  return (
    <div className={cn("px-4 mt-3", className)}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {chips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <motion.button
              key={chip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleChipClick(chip.route)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "backdrop-blur-md bg-card/70 dark:bg-card/50",
                "border border-white/20 dark:border-white/10",
                "shadow-sm",
                "snap-start shrink-0",
                "active:scale-95 transition-transform duration-150"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn("p-1 rounded-full", chip.bgColor)}>
                <Icon className={cn("h-3 w-3", chip.color)} />
              </div>
              <span className={cn("text-xs font-semibold tabular-nums", chip.color)}>
                {chip.value}
              </span>
              {chip.label && (
                <span className="text-[10px] text-muted-foreground">
                  {chip.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
