import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TestActionItem {
  id: string;
  kind: "offer";
  centre: string | null;
  date: string | null;
  time: string | null;
  createdAt: string;
}

export function useTestActionItems(instructorId: string | undefined, limit = 5) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["test-action-items", instructorId, limit],
    queryFn: async (): Promise<TestActionItem[]> => {
      if (!instructorId) return [];

      const offersRes = await supabase
        .from("test_swap_offers")
        .select(
          "id, offered_test_date, offered_test_time, offered_test_centre_name, created_at, test_requests!inner(instructor_id)"
        )
        .eq("test_requests.instructor_id", instructorId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);

      const offers: TestActionItem[] = (offersRes.data || []).map((r: any) => ({
        id: r.id,
        kind: "offer",
        centre: r.offered_test_centre_name ?? null,
        date: r.offered_test_date ?? null,
        time: r.offered_test_time ?? null,
        createdAt: r.created_at,
      }));

      return offers
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit);
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (!instructorId) return;
    const channel = supabase
      .channel(`test-action-items-${instructorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "test_swap_offers" }, () =>
        queryClient.invalidateQueries({ queryKey: ["test-action-items", instructorId, limit] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [instructorId, queryClient, limit]);

  return query;
}
