import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pending jobs = unassigned pool jobs (course_enquiries) +
 * direct mini-site enquiries to this instructor (booking_enquiries).
 * RLS on booking_enquiries already scopes rows to the logged-in instructor.
 */
export function usePendingJobsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchPendingJobs = async () => {
      const [poolRes, directRes] = await Promise.all([
        supabase
          .from("course_enquiries")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("booking_enquiries")
          .select("*", { count: "exact", head: true })
          .eq("status", "new"),
      ]);

      const pool = !poolRes.error && poolRes.count !== null ? poolRes.count : 0;
      const direct = !directRes.error && directRes.count !== null ? directRes.count : 0;
      setCount(pool + direct);
    };

    fetchPendingJobs();

    const channel = supabase
      .channel("pending-jobs-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "course_enquiries" }, () => { fetchPendingJobs(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_enquiries" }, () => { fetchPendingJobs(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
