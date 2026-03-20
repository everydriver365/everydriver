import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImpactEvent {
  id: string;
  g_force: number | null;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  event_time: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
}

export function useGeotabImpactEvents(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["geotab-impact-events", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geotab_impact_events")
        .select("*")
        .eq("instructor_id", instructorId!)
        .order("event_time", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ImpactEvent[];
    },
    enabled: !!instructorId,
    staleTime: 60 * 1000,
  });
}

export function useAcknowledgeImpact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("geotab_impact_events")
        .update({ acknowledged: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geotab-impact-events"] }),
  });
}
