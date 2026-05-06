import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePhoneSpeedLimit, haversineMetres } from "@/lib/phoneSpeedLimit";

export interface PhoneFix {
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
  speedLimitKmh?: number | null;
}

interface Options {
  /** Active provider — only streams when this is "phone". */
  provider: "phone" | "radius" | null;
  /** Pupil currently being driven (optional). */
  pupilId: string | null;
  /** Optional active telematics session id. */
  sessionId?: string | null;
  /** Throttle uploads to at most one per N ms (default 2000). */
  minIntervalMs?: number;
  /** Optional callback fired on every accepted GPS fix (after throttling). */
  onPosition?: (fix: PhoneFix) => void;
}

/**
 * When `provider === "phone"`, watches the device GPS via
 * `navigator.geolocation.watchPosition` and streams the latest fix into
 * `live_pupil_positions` via the `update_live_position` RPC.
 *
 * Also resolves a per-fix speed limit (cached) and persists each accepted
 * fix into `telematics_gps_points` (via `record_phone_gps_point`) when a
 * telematics session is running, so end-of-lesson route, distance and
 * speed graphs are populated identically to OBD/Radius hardware sessions.
 */
export function usePhoneTrackingStreamer({
  provider,
  pupilId,
  sessionId = null,
  minIntervalMs = 2000,
  onPosition,
}: Options) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastLimitFetchRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const cachedLimitRef = useRef<number | null>(null);

  useEffect(() => {
    if (provider !== "phone") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("[PhoneTracking] geolocation API unavailable");
      return;
    }

    let cancelled = false;
    lastPointRef.current = null;
    lastLimitFetchRef.current = null;
    cachedLimitRef.current = null;

    (async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        /* ignore */
      }
    })();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (cancelled) return;
        const now = Date.now();
        if (now - lastSentRef.current < minIntervalMs) return;
        lastSentRef.current = now;

        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        const speedKmh = speed != null && !Number.isNaN(speed) ? speed * 3.6 : 0;

        // Distance delta vs last accepted point
        let distanceDeltaKm = 0;
        if (lastPointRef.current) {
          const m = haversineMetres(
            lastPointRef.current.lat, lastPointRef.current.lng,
            latitude, longitude,
          );
          // Ignore jitter < 3 m and unrealistic jumps (> 500 m between fixes)
          if (m >= 3 && m < 500) distanceDeltaKm = m / 1000;
        }
        lastPointRef.current = { lat: latitude, lng: longitude };

        // Resolve speed limit — only re-fetch if moved >30 m or >15 s old
        const lastFetch = lastLimitFetchRef.current;
        const movedFar = !lastFetch || haversineMetres(
          lastFetch.lat, lastFetch.lng, latitude, longitude,
        ) > 30;
        const stale = !lastFetch || (now - lastFetch.at) > 15000;
        if (movedFar || stale) {
          lastLimitFetchRef.current = { lat: latitude, lng: longitude, at: now };
          // Fire-and-forget; cache result for next emission
          resolvePhoneSpeedLimit(latitude, longitude)
            .then((limit) => { cachedLimitRef.current = limit; })
            .catch(() => {});
        }
        const speedLimitKmh = cachedLimitRef.current;

        try {
          onPosition?.({
            latitude,
            longitude,
            speedKmh,
            heading: heading != null && !Number.isNaN(heading) ? heading : null,
            accuracy: accuracy ?? null,
            timestamp: pos.timestamp ?? now,
            speedLimitKmh,
          });
        } catch { /* ignore consumer errors */ }

        // Push live position (requires pupil)
        if (pupilId) {
          try {
            await supabase.rpc("update_live_position", {
              p_pupil_id: pupilId,
              p_latitude: latitude,
              p_longitude: longitude,
              p_speed_kmh: speedKmh,
              p_heading: heading != null && !Number.isNaN(heading) ? heading : null,
              p_accuracy: accuracy ?? null,
              p_trip_status: "driving",
              p_session_id: sessionId,
              p_speed_limit_kmh: speedLimitKmh ?? null,
            } as any);
          } catch (err) {
            console.warn("[PhoneTracking] update_live_position failed:", err);
          }
        }

        // Persist GPS history for end-of-lesson route + distance
        if (sessionId) {
          try {
            await supabase.rpc("record_phone_gps_point", {
              p_session_id: sessionId,
              p_latitude: latitude,
              p_longitude: longitude,
              p_speed_kmh: speedKmh,
              p_heading: heading != null && !Number.isNaN(heading) ? heading : null,
              p_accuracy: accuracy ?? null,
              p_speed_limit_kmh: speedLimitKmh ?? null,
              p_road_name: null,
              p_distance_delta_km: distanceDeltaKm,
            } as any);
          } catch (err) {
            console.warn("[PhoneTracking] record_phone_gps_point failed:", err);
          }
        }
      },
      (err) => console.warn("[PhoneTracking] geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 10000 }
    );

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [provider, pupilId, sessionId, minIntervalMs]);
}
