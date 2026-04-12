import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, MapPin, Clock, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ImpactEvent {
  id: string;
  event_type: string;
  severity: string;
  g_force: number | null;
  speed_at_event: number | null;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string;
  notes: string | null;
  is_dismissed: boolean | null;
}

export function ImpactAlertCard({ instructorId }: { instructorId: string }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: impacts } = useQuery({
    queryKey: ["impact-alerts", instructorId],
    queryFn: async () => {
      // Get recent telematics sessions for this instructor
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", instructorId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (!sessions?.length) return [];

      const sessionIds = sessions.map((s) => s.id);
      const { data: events } = await supabase
        .from("driving_behavior_events")
        .select("*")
        .in("telematics_id", sessionIds)
        .eq("severity", "high")
        .is("is_dismissed", false)
        .order("recorded_at", { ascending: false })
        .limit(5);

      return (events || []) as ImpactEvent[];
    },
    refetchInterval: 30000,
  });

  const visibleImpacts = (impacts || []).filter((e) => !dismissed.has(e.id));

  if (visibleImpacts.length === 0) return null;

  const handleDismiss = async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    await supabase
      .from("driving_behavior_events")
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq("id", id);
  };

  const severityColor = (gForce: number | null) => {
    if (!gForce) return "text-amber-500";
    if (gForce > 0.8) return "text-red-500";
    if (gForce > 0.5) return "text-orange-500";
    return "text-amber-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-red-500" />
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Impact Alerts
        </p>
      </div>

      <AnimatePresence>
        {visibleImpacts.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3.5 relative overflow-hidden"
          >
            <button
              onClick={() => handleDismiss(event.id)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted/50"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className={`h-5 w-5 ${severityColor(event.g_force)}`} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-semibold text-foreground capitalize">
                  {event.event_type.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  {event.g_force && (
                    <span className={`font-semibold ${severityColor(event.g_force)}`}>
                      {event.g_force.toFixed(2)}g
                    </span>
                  )}
                  {event.speed_at_event && <span>{Math.round(event.speed_at_event)} km/h</span>}
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.recorded_at), "HH:mm")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
