import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SoonestOffer {
  id: string;
  created_at: string;
}

/**
 * Returns the soonest-created pending course enquiry (job offer)
 * for SLA "respond within X hours" surfacing. Live updates via realtime.
 */
export function useSoonestPendingOffer(instructorId: string | undefined) {
  const [data, setData] = useState<SoonestOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSoonest = async () => {
      const { data: rows } = await supabase
        .from("course_enquiries")
        .select("id, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);
      if (!cancelled) {
        setData(rows && rows.length > 0 ? (rows[0] as SoonestOffer) : null);
        setIsLoading(false);
      }
    };

    fetchSoonest();

    const channel = supabase
      .channel("soonest-pending-offer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_enquiries" },
        () => fetchSoonest()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  return { data, isLoading };
}
