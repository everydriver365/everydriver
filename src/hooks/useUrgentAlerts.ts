import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export interface UrgentAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

export function useUrgentAlerts(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["urgent-alerts", instructorId],
    queryFn: async (): Promise<UrgentAlert[]> => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from("urgent_alerts")
        .select("id, title, message, severity, created_at")
        .or(`instructor_id.eq.${instructorId},is_broadcast.eq.true`)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching urgent alerts:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!instructorId,
    refetchInterval: 30_000,
  });

  useRealtimeSubscription(
    "urgent_alerts",
    "INSERT",
    () => {
      queryClient.invalidateQueries({ queryKey: ["urgent-alerts", instructorId] });
    },
    { enabled: !!instructorId }
  );

  const dismissAlert = async (alertId: string) => {
    await supabase
      .from("urgent_alerts")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", alertId);

    queryClient.invalidateQueries({ queryKey: ["urgent-alerts", instructorId] });
  };

  return { alerts: query.data || [], dismissAlert };
}
