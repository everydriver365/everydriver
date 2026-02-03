import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeeklyComparisonBarProps {
  thisWeek: number;
  lastWeek: number;
}

export function WeeklyComparisonBar({ thisWeek, lastWeek }: WeeklyComparisonBarProps) {
  const maxValue = Math.max(thisWeek, lastWeek, 1);
  const thisWeekPercent = (thisWeek / maxValue) * 100;
  const lastWeekPercent = (lastWeek / maxValue) * 100;
  
  const difference = thisWeek - lastWeek;
  const percentChange = lastWeek > 0 ? Math.round((difference / lastWeek) * 100) : 0;
  
  const isUp = difference > 0;
  const isDown = difference < 0;
  const isFlat = difference === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Week Comparison</span>
        <div className="flex items-center gap-1">
          {isUp && <TrendingUp className="h-4 w-4 text-emerald-500" />}
          {isDown && <TrendingDown className="h-4 w-4 text-rose-500" />}
          {isFlat && <Minus className="h-4 w-4 text-muted-foreground" />}
          <span className={`text-sm font-semibold ${
            isUp ? "text-emerald-600" : isDown ? "text-rose-600" : "text-muted-foreground"
          }`}>
            {isUp ? "+" : ""}{percentChange}%
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">This week</span>
            <span className="font-semibold">£{thisWeek}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${thisWeekPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Last week</span>
            <span className="font-medium text-muted-foreground">£{lastWeek}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lastWeekPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="h-full bg-muted-foreground/40 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
