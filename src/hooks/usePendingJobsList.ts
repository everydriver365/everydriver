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
  source: "course_enquiry" | "booking_enquiry";
}

const EXPIRY_HOURS = 24;

export function usePendingJobsList(limit = 5) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pending-jobs-list", limit],
    queryFn: async (): Promise<PendingJobItem[]> => {
      const [poolRes, directRes] = await Promise.all([
        supabase
          .from("course_enquiries")
          .select("id, course_type, requested_hours, created_at, postcode")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("booking_enquiries")
          .select("id, course_name, course_hours, created_at, pupil_postcode")
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

      if (poolRes.error) throw poolRes.error;
      if (directRes.error) throw directRes.error;

      const now = new Date();
      const toItem = (
        id: string,
        courseType: string,
        hours: number | null,
        created_at: string,
        postcode: string | null,
        source: PendingJobItem["source"],
      ): PendingJobItem => {
        const createdAt = new Date(created_at);
        const expiry = new Date(createdAt.getTime() + EXPIRY_HOURS * 3600 * 1000);
        return {
          id,
          courseType,
          hours,
          createdAt: created_at,
          expiresInHours: Math.max(0, differenceInHours(expiry, now)),
          postcode,
          source,
        };
      };

      const pool = (poolRes.data ?? []).map((r) =>
        toItem(r.id, r.course_type, r.requested_hours ?? null, r.created_at, r.postcode ?? null, "course_enquiry"),
      );
      const direct = (directRes.data ?? []).map((r) =>
        toItem(
          r.id,
          r.course_name || "Direct enquiry",
          r.course_hours != null ? Number(r.course_hours) : null,
          r.created_at,
          r.pupil_postcode ?? null,
          "booking_enquiry",
        ),
      );

      return [...pool, ...direct]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
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
        () => queryClient.invalidateQueries({ queryKey: ["pending-jobs-list", limit] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_enquiries" },
        () => queryClient.invalidateQueries({ queryKey: ["pending-jobs-list", limit] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, limit]);

  return query;
}
