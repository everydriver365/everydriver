import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, Car, Briefcase, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface QuickStatsChipsProps {
  hoursToday?: number;
  lessonCount?: number;
  pendingJobs?: number;
  weatherTemp?: number | null;
  weatherIcon?: string;
  className?: string;
}

export function QuickStatsChips({
  hoursToday = 0,
  lessonCount = 0,
  pendingJobs = 0,
  weatherTemp,
  weatherIcon,
  className,
}: QuickStatsChipsProps) {
  const navigate = useNavigate();

  const chips = [
    {
      id: "hours",
      icon: Clock,
      label: `${hoursToday}h today`,
      route: "/instructor/schedule",
      color: "text-primary",
    },
    {
      id: "lessons",
      icon: Car,
      label: `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`,
      route: "/instructor/schedule",
      color: "text-primary",
    },
    ...(pendingJobs > 0
      ? [{
          id: "jobs",
          icon: Briefcase,
          label: `${pendingJobs} job offer${pendingJobs !== 1 ? 's' : ''}`,
          route: "/instructor/jobs",
          color: "text-amber-700",
        }]
      : []),
    ...(weatherTemp !== null && weatherTemp !== undefined
      ? [{
          id: "weather",
          icon: null as any,
          label: `${weatherTemp}°C`,
          route: "",
          color: "text-amber-600",
          isWeather: true,
        }]
      : []),
  ];

  return (
    <div className={cn("px-4", className)}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {chips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <motion.button
              key={chip.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (chip.route) {
                  haptics.selection();
                  navigate(chip.route);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                "bg-white border border-border/60",
                "shadow-[0_1px_4px_rgba(20,37,66,0.06)]",
                "snap-start shrink-0",
                "active:scale-95 transition-transform duration-150"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {Icon && <Icon className={cn("h-4 w-4", chip.color)} />}
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {chip.label}
              </span>
            </motion.button>
          );
        })}
        {/* Scroll indicator */}
        <div className="flex items-center shrink-0 pl-1 pr-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
}
