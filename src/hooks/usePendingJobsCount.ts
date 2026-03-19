import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { demoPendingJobsCount } from "@/data/demoData";

export function usePendingJobsCount() {
  const { isDemoMode } = useDemoMode();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchPendingJobs = async () => {
      const { count: pendingCount, error } = await supabase
        .from("course_enquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (!error && pendingCount !== null) {
        setCount(pendingCount);
      }
    };

    fetchPendingJobs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("pending-jobs-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_enquiries",
        },
        () => {
          fetchPendingJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isDemoMode) return demoPendingJobsCount;
  return count;
}
