import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KM_TO_MILES = 0.621371;

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
  /** Latest odometer reading in miles (converted from km). */
  odometerMiles: number | null;
  /** Miles driven in the last 7 days, derived from odometer snapshots. */
  last7dMiles: number | null;
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
  odometerMiles: null,
  last7dMiles: null,
};

/**
 * Aggregates Geotab signals for the instructor home health tile.
 * Returns {hasGeotab:false} when the instructor has no active Geotab device —
 * callers should hide the tile entirely in that case (no empty state).
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
        .select("id, device_name, last_seen_at, tracking_provider, is_active, last_odometer_km")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "geotab");

      const active = (devices ?? []).filter((d: any) => d.is_active !== false);
      if (active.length === 0) return EMPTY;

      const primary = active[0] as any;
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [faultRes, harshRes, impactRes, clipsRes, snap7dRes] = await Promise.all([
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
          .gte("recorded_at", since7d),
        supabase
          .from("geotab_odometer_snapshots")
          .select("odometer_km, captured_at")
          .eq("device_id", primary.id)
          .gte("captured_at", since7d)
          .order("captured_at", { ascending: true })
          .limit(1),
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

      const odometerKm: number | null =
        typeof primary?.last_odometer_km === "number" ? primary.last_odometer_km : null;
      const odometerMiles = odometerKm !== null ? odometerKm * KM_TO_MILES : null;

      const firstSnap = (snap7dRes.data ?? [])[0] as any;
      const last7dMiles =
        odometerKm !== null && firstSnap && typeof firstSnap.odometer_km === "number"
          ? Math.max(0, (odometerKm - firstSnap.odometer_km) * KM_TO_MILES)
          : null;

      return {
        hasGeotab: true,
        score,
        activeFaults,
        harshEvents24h,
        unacknowledgedImpacts24h,
        recentClips7d,
        deviceName: primary?.device_name ?? null,
        lastSeenAt: primary?.last_seen_at ?? null,
        odometerMiles,
        last7dMiles,
      };
    },
  });
}
