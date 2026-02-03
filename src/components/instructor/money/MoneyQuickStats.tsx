import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoneyQuickStatsProps {
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  hoursThisMonth: number;
  hourlyRate: number;
}

export function MoneyQuickStats({
  thisWeek,
  thisMonth,
  lastMonth,
  hoursThisMonth,
  hourlyRate,
}: MoneyQuickStatsProps) {
  const weeklyAvg = hoursThisMonth > 0 ? Math.round(thisMonth / (hoursThisMonth / 4)) : 0;
  const projectedMonth = hoursThisMonth > 0 ? Math.round((thisMonth / hoursThisMonth) * 40) : 0;
  
  const monthChange = lastMonth > 0 
    ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
    : 0;

  const stats = [
    {
      label: "Weekly Avg",
      value: `£${weeklyAvg}`,
      icon: CalendarDays,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "vs Last Month",
      value: `${monthChange >= 0 ? "+" : ""}${monthChange}%`,
      icon: monthChange >= 0 ? TrendingUp : TrendingDown,
      color: monthChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bgColor: monthChange >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30",
    },
    {
      label: "Projected",
      value: `£${projectedMonth}`,
      icon: Clock,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={cn(
              "flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl",
              "bg-card/80 backdrop-blur-sm border border-border/50",
              "min-w-[130px]"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              stat.bgColor
            )}>
              <Icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <div>
              <p className={cn("font-semibold text-sm", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
