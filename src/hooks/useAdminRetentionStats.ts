import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RetentionStats {
  active30d: number;
  active60d: number;
  retentionPct: number | null;
  loading: boolean;
}

/**
 * Pupil retention = (distinct pupils with a non-cancelled lesson in last 30d)
 *                 / (distinct pupils with a non-cancelled lesson in last 60d)
 * Surfaces null when the 60d denominator is 0.
 */
export function useAdminRetentionStats(): RetentionStats {
  const [state, setState] = useState<RetentionStats>({
    active30d: 0,
    active60d: 0,
    retentionPct: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [r30, r60] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("pupil_id")
          .gte("created_at", d30)
          .neq("status", "cancelled"),
        supabase
          .from("scheduled_lessons")
          .select("pupil_id")
          .gte("created_at", d60)
          .neq("status", "cancelled"),
      ]);

      if (cancelled) return;

      const set30 = new Set((r30.data ?? []).map((r: any) => r.pupil_id).filter(Boolean));
      const set60 = new Set((r60.data ?? []).map((r: any) => r.pupil_id).filter(Boolean));
      const pct = set60.size > 0 ? Math.round((set30.size / set60.size) * 100) : null;

      setState({
        active30d: set30.size,
        active60d: set60.size,
        retentionPct: pct,
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
