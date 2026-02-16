import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useTestSwapNotifications(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["test-swap-notifications", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;

      // Count pending swap offers on this instructor's test requests
      const { count: pendingOffers } = await supabase
        .from("test_swap_offers")
        .select("*, test_requests!inner(instructor_id)", { count: "exact", head: true })
        .eq("test_requests.instructor_id", instructorId)
        .eq("status", "pending");

      // Get centres this instructor wants a test at
      const { data: wantRequests } = await supabase
        .from("test_requests")
        .select("test_centre_id")
        .eq("instructor_id", instructorId)
        .eq("request_type", "want_test")
        .eq("status", "active");

      const wantedCentreIds = (wantRequests || []).map(r => r.test_centre_id).filter(Boolean);

      let matchingTests = 0;
      if (wantedCentreIds.length > 0) {
        // Count have_test listings at centres the instructor is looking for
        const { count } = await supabase
          .from("test_requests")
          .select("*", { count: "exact", head: true })
          .eq("request_type", "have_test")
          .eq("status", "active")
          .in("test_centre_id", wantedCentreIds);
        matchingTests = count || 0;
      }

      return (pendingOffers || 0) + matchingTests;
    },
    enabled: !!instructorId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`test-swap-notifs-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_swap_offers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["test-swap-notifications", instructorId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["test-swap-notifications", instructorId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, queryClient]);

  return query;
}
