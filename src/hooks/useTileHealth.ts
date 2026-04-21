import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HealthAlert {
  id: string;
  instructor_id: string | null;
  source: string;
  severity: "warn" | "fail";
  message: string;
  created_at: string;
  resolved_at: string | null;
}

export function useTileHealth(instructorId: string | undefined) {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("instructor_health_alerts")
        .select("*")
        .or(`instructor_id.eq.${instructorId},instructor_id.is.null`)
        .is("resolved_at", null)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setAlerts((data ?? []) as HealthAlert[]);
        setLoading(false);
      }
    };
    load();

    const ch = supabase
      .channel(`health-alerts-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructor_health_alerts" },
        () => { load(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [instructorId]);

  const sources = new Set(alerts.map((a) => a.source));

  return {
    alerts,
    loading,
    hasOutage: alerts.length > 0,
    hasOutageFor: (source: string) => sources.has(source),
    lastChecked: alerts[0]?.created_at ?? null,
  };
}
