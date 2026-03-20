import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Flame, ChevronRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface RecentAlert {
  id: string;
  alert_type: string;
  severity: string;
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  road_name: string | null;
  created_at: string;
}

interface SpeedHeatmapPreviewProps {
  onExpand?: () => void;
}

export function SpeedHeatmapPreview({ onExpand }: SpeedHeatmapPreviewProps) {
  const { instructor } = useInstructorAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["speed-alerts-preview", instructor?.id],
    enabled: !!instructor?.id,
    queryFn: async () => {
      // Get session IDs
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", instructor!.id)
        .order("started_at", { ascending: false })
        .limit(100);

      if (!sessions?.length) return { count: 0, recent: [], topRoad: null };

      const sessionIds = sessions.map(s => s.id);

      // Count total speeding events
      const { count } = await supabase
        .from("telematics_alerts")
        .select("id", { count: "exact", head: true })
        .eq("alert_type", "speeding")
        .in("telematics_id", sessionIds);

      // Recent 5 alerts
      const { data: recent } = await supabase
        .from("telematics_alerts")
        .select("id, alert_type, severity, speed_kmh, speed_limit_kmh, road_name, created_at")
        .eq("alert_type", "speeding")
        .in("telematics_id", sessionIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Find top road
      const { data: allAlerts } = await supabase
        .from("telematics_alerts")
        .select("road_name")
        .eq("alert_type", "speeding")
        .not("road_name", "is", null)
        .in("telematics_id", sessionIds);

      let topRoad: string | null = null;
      if (allAlerts?.length) {
        const roadCounts: Record<string, number> = {};
        allAlerts.forEach(a => {
          if (a.road_name) roadCounts[a.road_name] = (roadCounts[a.road_name] || 0) + 1;
        });
        const sorted = Object.entries(roadCounts).sort((a, b) => b[1] - a[1]);
        topRoad = sorted[0]?.[0] || null;
      }

      return { 
        count: count || 0, 
        recent: (recent || []) as RecentAlert[], 
        topRoad 
      };
    },
  });

  if (isLoading) {
    return <div className="h-36 rounded-2xl bg-muted/30 animate-pulse" />;
  }

  const { count = 0, recent = [], topRoad } = data || {};

  if (count === 0) {
    return null; // Don't show if no speeding data
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-orange-500 text-white";
      default: return "bg-amber-500/20 text-amber-700";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onExpand}
        className="w-full text-left rounded-2xl border border-border/40 bg-card overflow-hidden transition-all active:scale-[0.98]"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Speed Hotspots</p>
              <p className="text-[11px] text-muted-foreground">
                {count} event{count !== 1 ? "s" : ""} this month
                {topRoad && (
                  <span className="text-muted-foreground"> · Top: {topRoad}</span>
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Recent alerts */}
        {recent.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            {recent.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    alert.severity === "high" ? "bg-destructive" :
                    alert.severity === "medium" ? "bg-orange-500" : "bg-amber-500"
                  )} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">
                      {alert.road_name || "Unknown road"}
                    </p>
                    {alert.speed_kmh && alert.speed_limit_kmh && (
                      <p className="text-[10px] text-muted-foreground">
                        {Math.round(alert.speed_kmh * 0.621371)} mph in {Math.round(alert.speed_limit_kmh * 0.621371)} zone
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {format(new Date(alert.created_at!), "dd MMM")}
                </span>
              </div>
            ))}
          </div>
        )}
      </button>
    </motion.div>
  );
}
