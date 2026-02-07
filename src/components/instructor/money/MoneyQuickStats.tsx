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
      color: "text-foreground",
      bgColor: "bg-muted/50",
    },
    {
      label: "vs Last Month",
      value: `${monthChange >= 0 ? "+" : ""}${monthChange}%`,
      icon: monthChange >= 0 ? TrendingUp : TrendingDown,
      color: monthChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
      bgColor: "bg-muted/50",
    },
    {
      label: "Projected",
      value: `£${projectedMonth}`,
      icon: Clock,
      color: "text-foreground",
      bgColor: "bg-muted/50",
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5",
              "bg-card border border-border",
              "min-w-[130px]"
            )}
          >
            <div className={cn(
              "h-8 w-8 flex items-center justify-center",
              stat.bgColor
            )}>
              <Icon className={cn("h-4 w-4 text-muted-foreground")} />
            </div>
            <div>
              <p className={cn("font-semibold text-sm", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
