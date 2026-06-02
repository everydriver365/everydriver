import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GeotabHealthSummary {
  hasGeotab: boolean;
  /** 0-100 health score. null until we have at least one signal to compute from. */
  score: number | null;
  activeFaults: number;
  /** Driver-behaviour events (harsh accel/brake/cornering/speeding) in last 24h. */
  harshEvents24h: number;
  /** Unacknowledged impact events in last 24h. */
  unacknowledgedImpacts24h: number;
  /** Dashcam clips recorded in last 7d (for the Video shortcut). */
  recentClips7d: number;
  deviceName: string | null;
  lastSeenAt: string | null;
}

const EMPTY: GeotabHealthSummary = {
  hasGeotab: false,
  score: null,
  activeFaults: 0,
  harshEvents24h: 0,
  unacknowledgedImpacts24h: 0,
  recentClips7d: 0,
  deviceName: null,
  lastSeenAt: null,
};

/**
 * Aggregates Geotab signals for the instructor home health tile.
 * Returns {hasGeotab:false} when the instructor has no active Geotab device —
 * callers should hide the tile entirely in that case (no empty state).
 *
 * Score model (transparent — derived 100% from live DB rows, no fallbacks):
 *   start at 100
 *     − 8 per active fault (capped at 40)
 *     − 4 per harsh driver event in 24h (capped at 30)
 *     − 25 if any unacknowledged impact in 24h
 *   floored at 0.
 */
export function useGeotabHealth(instructorId: string | null | undefined) {
  return useQuery<GeotabHealthSummary>({
    queryKey: ["geotab-health", instructorId],
    enabled: !!instructorId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    queryFn: async () => {
      if (!instructorId) return EMPTY;

      const { data: devices } = await supabase
        .from("gps_devices")
        .select("id, device_name, last_seen_at, tracking_provider, is_active")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "geotab");

      const active = (devices ?? []).filter((d: any) => d.is_active !== false);
      if (active.length === 0) return EMPTY;

      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [faultRes, harshRes, impactRes, clipsRes] = await Promise.all([
        supabase
          .from("geotab_fault_codes")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("geotab_driver_events")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .gte("started_at", since24h),
        supabase
          .from("geotab_impact_events")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("acknowledged", false)
          .gte("event_time", since24h),
        supabase
          .from("dashcam_media")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .gte("captured_at", since7d),
      ]);

      const activeFaults = faultRes.count ?? 0;
      const harshEvents24h = harshRes.count ?? 0;
      const unacknowledgedImpacts24h = impactRes.count ?? 0;
      const recentClips7d = clipsRes.count ?? 0;

      const deduction =
        Math.min(activeFaults * 8, 40) +
        Math.min(harshEvents24h * 4, 30) +
        (unacknowledgedImpacts24h > 0 ? 25 : 0);
      const score = Math.max(0, 100 - deduction);

      const primary = active[0] as any;
      return {
        hasGeotab: true,
        score,
        activeFaults,
        harshEvents24h,
        unacknowledgedImpacts24h,
        recentClips7d,
        deviceName: primary?.device_name ?? null,
        lastSeenAt: primary?.last_seen_at ?? null,
      };
    },
  });
}
