import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldCheck, Fuel, Timer, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Progress } from "@/components/ui/progress";

interface DrivingStats {
  drivingScore: number;
  avgSpeedMph: number;
  idlePercent: number;
  totalMiles: number;
  totalDrivingHours: number;
  totalIdleMinutes: number;
  behaviorEvents: number;
  days: number;
}

export function PersonalDrivingStatsCard({ className = "" }: { className?: string }) {
  const { instructor } = useInstructorAuth();

  const { data: stats } = useQuery({
    queryKey: ["personal-driving-stats", instructor?.id],
    queryFn: async (): Promise<DrivingStats | null> => {
      if (!instructor?.id) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Fetch timesheets and behavior events in parallel
      const [tsRes, sessionsRes] = await Promise.all([
        supabase
          .from("driver_timesheets")
          .select("total_distance_km, total_driving_minutes, total_idle_minutes")
          .eq("instructor_id", instructor.id)
          .gte("sheet_date", dateStr),
        supabase
          .from("lesson_telematics")
          .select("id")
          .eq("instructor_id", instructor.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const timesheets = tsRes.data || [];
      if (timesheets.length === 0) return null;

      let totalKm = 0, totalDrivingMin = 0, totalIdleMin = 0;
      timesheets.forEach((t) => {
        totalKm += t.total_distance_km || 0;
        totalDrivingMin += t.total_driving_minutes || 0;
        totalIdleMin += t.total_idle_minutes || 0;
      });

      const sessionIds = (sessionsRes.data || []).map((s) => s.id);
      let behaviorEvents = 0;

      if (sessionIds.length > 0) {
        const batchSize = 200;
        for (let i = 0; i < sessionIds.length; i += batchSize) {
          const batch = sessionIds.slice(i, i + batchSize);
          const { count } = await supabase
            .from("driving_behavior_events")
            .select("id", { count: "exact", head: true })
            .in("telematics_id", batch);
          behaviorEvents += count || 0;
        }
      }

      const totalMiles = totalKm * 0.621371;
      const totalHours = totalDrivingMin / 60;
      const avgMph = totalHours > 0 ? Math.round((totalMiles / totalHours) * 10) / 10 : 0;
      const totalMin = totalDrivingMin + totalIdleMin;
      const idlePct = totalMin > 0 ? Math.round((totalIdleMin / totalMin) * 100) : 0;

      // Driving score: 100 minus events penalty
      const eventsPer100Mi = totalMiles > 0 ? (behaviorEvents / totalMiles) * 100 : 0;
      const rawScore = 100 - eventsPer100Mi * 3;
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));

      return {
        drivingScore: score,
        avgSpeedMph: avgMph,
        idlePercent: idlePct,
        totalMiles: Math.round(totalMiles),
        totalDrivingHours: Math.round(totalHours * 10) / 10,
        totalIdleMinutes: Math.round(totalIdleMin),
        behaviorEvents,
        days: timesheets.length,
      };
    },
    enabled: !!instructor?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}
      >
        <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your Driving Stats</p>
            <p className="text-[11px] text-muted-foreground">Last 30 days</p>
          </div>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No driving data yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Stats will appear once your tracker records trips</p>
        </div>
      </motion.div>
    );
  }

  const scoreColor =
    stats.drivingScore >= 80
      ? "text-emerald-500"
      : stats.drivingScore >= 60
        ? "text-amber-500"
        : "text-destructive";

  const scoreBarColor =
    stats.drivingScore >= 80
      ? "[&>div]:bg-emerald-500"
      : stats.drivingScore >= 60
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-destructive";

  const idleColor =
    stats.idlePercent <= 15
      ? "text-emerald-500"
      : stats.idlePercent <= 30
        ? "text-amber-500"
        : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your Driving Stats</p>
            <p className="text-[11px] text-muted-foreground">Last 30 days · {stats.days} active days</p>
          </div>
        </div>
      </div>

      {/* Score hero */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold tabular-nums leading-none ${scoreColor}`}>
            {stats.drivingScore}
          </span>
          <span className="text-sm text-muted-foreground pb-0.5">/ 100 driving score</span>
        </div>
        <Progress value={stats.drivingScore} className={`h-2 mt-2.5 ${scoreBarColor}`} />
        {stats.behaviorEvents > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            {stats.behaviorEvents} harsh event{stats.behaviorEvents !== 1 ? "s" : ""} detected
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="px-3 pb-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <Fuel className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <p className="text-base font-bold tabular-nums">{stats.avgSpeedMph}</p>
          <p className="text-[10px] text-muted-foreground font-medium">avg mph</p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <Timer className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <p className={`text-base font-bold tabular-nums ${idleColor}`}>{stats.idlePercent}%</p>
          <p className="text-[10px] text-muted-foreground font-medium">idle time</p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
          <TrendingUp className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <p className="text-base font-bold tabular-nums">{stats.totalMiles.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground font-medium">miles</p>
        </div>
      </div>
    </motion.div>
  );
}
