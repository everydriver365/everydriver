import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInHours } from "date-fns";

export interface PendingJobItem {
  id: string;
  courseType: string;
  hours: number | null;
  createdAt: string;
  expiresInHours: number;
  postcode: string | null;
}

const EXPIRY_HOURS = 24;

export function usePendingJobsList(limit = 5) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pending-jobs-list", limit],
    queryFn: async (): Promise<PendingJobItem[]> => {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("id, course_type, requested_hours, created_at, postcode")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const now = new Date();
      return (data || []).map((row) => {
        const createdAt = new Date(row.created_at);
        const expiry = new Date(createdAt.getTime() + EXPIRY_HOURS * 3600 * 1000);
        return {
          id: row.id,
          courseType: row.course_type,
          hours: row.requested_hours ?? null,
          createdAt: row.created_at,
          expiresInHours: Math.max(0, differenceInHours(expiry, now)),
          postcode: row.postcode ?? null,
        };
      });
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("pending-jobs-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_enquiries" },
        () => queryClient.invalidateQueries({ queryKey: ["pending-jobs-list", limit] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, limit]);

  return query;
}
