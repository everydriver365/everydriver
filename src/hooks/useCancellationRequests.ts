import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCancellationRequestsCount(instructorId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchCount = async () => {
      const { count: requestCount, error } = await supabase
        .from("lesson_cancellation_requests")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("status", "pending");

      if (!error) {
        setCount(requestCount || 0);
      }
    };

    fetchCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("cancellation-requests-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_cancellation_requests",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  return count;
}
