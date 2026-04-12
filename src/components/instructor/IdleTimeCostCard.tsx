import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Timer, Fuel, TrendingDown } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";

const FUEL_COST_PER_LITRE = 1.45; // GBP
const IDLE_LITRES_PER_HOUR = 1.5; // Average car idle consumption

export function IdleTimeCostCard({ instructorId, className = "" }: { instructorId: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ["idle-time-cost", instructorId],
    queryFn: async () => {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const { data: timesheets } = await supabase
        .from("driver_timesheets")
        .select("total_idle_minutes, total_driving_minutes, total_distance_km")
        .eq("instructor_id", instructorId)
        .gte("sheet_date", weekStart)
        .lte("sheet_date", weekEnd);

      if (!timesheets?.length) return null;

      const totalIdleMinutes = timesheets.reduce((sum, t) => sum + (t.total_idle_minutes || 0), 0);
      const totalDrivingMinutes = timesheets.reduce((sum, t) => sum + (t.total_driving_minutes || 0), 0);
      const totalDistanceKm = timesheets.reduce((sum, t) => sum + (t.total_distance_km || 0), 0);

      if (totalIdleMinutes === 0 && totalDrivingMinutes === 0) return null;

      const idleHours = totalIdleMinutes / 60;
      const fuelWastedLitres = idleHours * IDLE_LITRES_PER_HOUR;
      const costWasted = fuelWastedLitres * FUEL_COST_PER_LITRE;
      const idlePercent = totalDrivingMinutes > 0
        ? Math.round((totalIdleMinutes / (totalIdleMinutes + totalDrivingMinutes)) * 100)
        : 0;

      return {
        totalIdleMinutes,
        totalDrivingMinutes,
        totalDistanceKm,
        fuelWastedLitres: Math.round(fuelWastedLitres * 10) / 10,
        costWasted: Math.round(costWasted * 100) / 100,
        idlePercent,
      };
    },
  });

  if (!data) return null;

  const idleHours = Math.floor(data.totalIdleMinutes / 60);
  const idleMins = data.totalIdleMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border bg-card p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Timer className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Idle Time This Week</p>
          <p className="text-[10px] text-muted-foreground">Engine on, not moving</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">
            {idleHours > 0 ? `${idleHours}h` : ""}{idleMins}m
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Idle time</p>
        </div>

        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold text-amber-500">
            £{data.costWasted.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Fuel wasted</p>
        </div>

        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">
            {data.idlePercent}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Of drive time</p>
        </div>
      </div>

      {data.idlePercent > 20 && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-500 bg-amber-500/5 rounded-2xl p-2">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          <span>Your idle time is above average. Try switching off between lessons to save fuel.</span>
        </div>
      )}
    </motion.div>
  );
}
