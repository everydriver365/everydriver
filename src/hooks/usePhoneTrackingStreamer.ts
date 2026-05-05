import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  /** Active provider — only streams when this is "phone". */
  provider: "phone" | "radius" | null;
  /** Pupil currently being driven (optional). */
  pupilId: string | null;
  /** Optional active telematics session id. */
  sessionId?: string | null;
  /** Throttle uploads to at most one per N ms (default 2000). */
  minIntervalMs?: number;
}

/**
 * When `provider === "phone"`, watches the device GPS via
 * `navigator.geolocation.watchPosition` and streams the latest fix into
 * `live_pupil_positions` via the `update_live_position` RPC.
 *
 * No-ops on the web when no pupil is selected — the RPC requires a pupil id.
 * Inside the Capacitor wrapper this still uses the browser API; background
 * delivery is handled by the native bridge.
 */
export function usePhoneTrackingStreamer({
  provider,
  pupilId,
  sessionId = null,
  minIntervalMs = 2000,
}: Options) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (provider !== "phone" || !pupilId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;

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
        try {
          await supabase.rpc("update_live_position", {
            p_pupil_id: pupilId,
            p_latitude: latitude,
            p_longitude: longitude,
            p_speed_kmh: speed != null && !Number.isNaN(speed) ? speed * 3.6 : 0,
            p_heading: heading != null && !Number.isNaN(heading) ? heading : null,
            p_accuracy: accuracy ?? null,
            p_trip_status: "driving",
            p_session_id: sessionId,
          } as any);
        } catch (err) {
          console.warn("[PhoneTracking] update_live_position failed:", err);
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
