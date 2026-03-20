import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DriverEvent {
  id: string;
  event_type: string;
  rule_name: string | null;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface BehaviourScores {
  overall: number;
  speed: number;
  acceleration: number;
  braking: number;
  cornering: number;
}

function computeScores(events: DriverEvent[]): BehaviourScores {
  if (!events.length) return { overall: 100, speed: 100, acceleration: 100, braking: 100, cornering: 100 };

  const deductions: Record<string, number> = { speeding: 0, harsh_accel: 0, harsh_brake: 0, harsh_corner: 0 };
  const sevWeight = { low: 2, medium: 5, high: 10, critical: 20 };

  for (const ev of events) {
    const w = sevWeight[ev.severity as keyof typeof sevWeight] || 2;
    if (ev.event_type in deductions) deductions[ev.event_type] += w;
  }

  const cap = (v: number) => Math.max(0, Math.min(100, v));
  const speed = cap(100 - deductions.speeding);
  const acceleration = cap(100 - deductions.harsh_accel);
  const braking = cap(100 - deductions.harsh_brake);
  const cornering = cap(100 - deductions.harsh_corner);
  const overall = Math.round((speed + acceleration + braking + cornering) / 4);

  return { overall, speed, acceleration, braking, cornering };
}

export function useGeotabDriverEvents(instructorId: string | undefined, fromDate?: Date, toDate?: Date) {
  return useQuery({
    queryKey: ["geotab-driver-events", instructorId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("geotab_driver_events")
        .select("*")
        .eq("instructor_id", instructorId!)
        .order("started_at", { ascending: false })
        .limit(200);

      if (fromDate) query = query.gte("started_at", fromDate.toISOString());
      if (toDate) query = query.lte("started_at", toDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      const events = (data || []) as DriverEvent[];
      return { events, scores: computeScores(events) };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
