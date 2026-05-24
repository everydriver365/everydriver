import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type QuickAccessUnreads = Record<string, number>;

const LABELS = ["Pending", "Test swap", "To do", "Reviews", "Reschedule"] as const;

async function safeCount(label: string, fn: () => Promise<number>): Promise<number> {
  try {
    return await fn();
  } catch (e) {
    console.warn(`[useQuickAccessUnreads] "${label}" count failed:`, e);
    return 0;
  }
}

/**
 * Returns live unread/pending counts keyed by Quick Access tile label.
 * Read-only. Missing tables / columns resolve to 0 and log a warning.
 */
export function useQuickAccessUnreads(instructorId: string | undefined): QuickAccessUnreads {
  const [counts, setCounts] = useState<QuickAccessUnreads>({});

  useEffect(() => {
    if (!instructorId) {
      setCounts({});
      return;
    }
    let cancelled = false;

    const load = async () => {
      const next: QuickAccessUnreads = {};
      for (const l of LABELS) next[l] = 0;

      next["Pending"] = await safeCount("Pending", async () => {
        const { count, error } = await supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("booking_status", "pending_approval");
        if (error) throw error;
        return count ?? 0;
      });

      next["Test swap"] = await safeCount("Test swap", async () => {
        // recipient = instructor that owns the underlying test_request
        const { data: tr, error: trErr } = await supabase
          .from("test_requests")
          .select("id")
          .eq("instructor_id", instructorId);
        if (trErr) throw trErr;
        const ids = (tr ?? []).map((r: any) => r.id);
        if (ids.length === 0) return 0;
        const { count, error } = await supabase
          .from("test_swap_offers")
          .select("id", { count: "exact", head: true })
          .in("test_request_id", ids)
          .eq("status", "pending");
        if (error) throw error;
        return count ?? 0;
      });

      next["To do"] = await safeCount("To do", async () => {
        const { count, error } = await supabase
          .from("instructor_todos")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("is_completed", false);
        if (error) throw error;
        return count ?? 0;
      });

      next["Reviews"] = await safeCount("Reviews", async () => {
        // lesson_ratings has no instructor_response column — feature not modelled yet.
        console.warn(
          '[useQuickAccessUnreads] "Reviews": lesson_ratings has no instructor_response column; returning 0.'
        );
        return 0;
      });

      next["Reschedule"] = await safeCount("Reschedule", async () => {
        const { count, error } = await supabase
          .from("reschedule_requests")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("status", "pending");
        if (error) throw error;
        return count ?? 0;
      });

      if (!cancelled) setCounts(next);
    };

    load();

    const channel = supabase
      .channel(`qa-unreads-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scheduled_lessons", filter: `instructor_id=eq.${instructorId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructor_todos", filter: `instructor_id=eq.${instructorId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reschedule_requests", filter: `instructor_id=eq.${instructorId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_swap_offers" },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  return counts;
}
