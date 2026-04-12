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
    },
    {
      id: "hours",
      icon: Clock,
      value: `${hoursToday}h`,
      label: "",
      route: "/instructor/schedule",
    },
    {
      id: "earnings",
      icon: PoundSterling,
      value: `£${expectedEarnings}`,
      label: "",
      route: "/instructor/earnings",
    },
  ];

  if (milesDriven !== undefined && milesDriven > 0) {
    chips.push({
      id: "miles",
      icon: Car,
      value: `${milesDriven}mi`,
      label: "",
      route: "/instructor/tracking",
    });
  }

  if (averageRating !== undefined && averageRating > 0) {
    chips.push({
      id: "rating",
      icon: Star,
      value: averageRating.toFixed(1),
      label: "",
      route: "/instructor/reviews",
    });
  }

  if (weeklyProgress !== undefined) {
    chips.push({
      id: "progress",
      icon: TrendingUp,
      value: `${weeklyProgress}%`,
      label: "goal",
      route: "/instructor/earnings",
    });
  }

  const handleChipClick = (route: string) => {
    haptics.selection();
    navigate(route);
  };

  return (
    <div className={cn("px-4 mt-3", className)}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip.route)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5",
                "bg-card border border-border rounded-full",
                "snap-start shrink-0",
                "active:scale-95 transition-transform duration-150"
              )}
            >
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {chip.value}
              </span>
              {chip.label && (
                <span className="text-[10px] text-muted-foreground">
                  {chip.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
