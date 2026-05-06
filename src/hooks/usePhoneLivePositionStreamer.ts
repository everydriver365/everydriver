import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePhoneSpeedLimit, haversineMetres } from "@/lib/phoneSpeedLimit";

interface Options {
  pupilId: string | null;
  enabled: boolean;
  sessionId?: string | null;
  /** Push interval in milliseconds (default 3000). */
  intervalMs?: number;
}

/**
 * Watches the device GPS and pushes the latest fix to
 * `phone_live_positions` via `upsert_phone_live_position` on a regular interval.
 */
export function usePhoneLivePositionStreamer({
  pupilId,
  enabled,
  sessionId = null,
  intervalMs = 3000,
}: Options) {
  const lastFixRef = useRef<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !pupilId || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastFixRef.current = pos;
      },
      (err) => console.warn("[phone-stream] geolocation error", err),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 10000 },
    );

    // Keep screen awake while streaming (best-effort).
    (async () => {
      try {
        // @ts-ignore — wakeLock not in older lib.dom typings
        wakeLockRef.current = await navigator.wakeLock?.request("screen");
      } catch {}
    })();

    const push = async () => {
      const pos = lastFixRef.current;
      if (!pos) return;
      const { latitude, longitude, speed, heading, accuracy } = pos.coords;
      // Best-effort battery level
      let battery: number | null = null;
      try {
        // @ts-ignore — getBattery not in lib.dom
        const b = await navigator.getBattery?.();
        if (b?.level != null) battery = Math.round(b.level * 100);
      } catch {}

      await supabase.rpc("upsert_phone_live_position", {
        p_pupil_id: pupilId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_speed_kmh: speed != null ? speed * 3.6 : 0,
        p_heading: heading ?? null,
        p_accuracy: accuracy ?? null,
        p_battery_level: battery,
        p_session_id: sessionId,
        p_provider: "phone",
      });
    };

    timerRef.current = setInterval(push, intervalMs);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      watchIdRef.current = null;
      timerRef.current = null;
      try { wakeLockRef.current?.release?.(); } catch {}
      wakeLockRef.current = null;
    };
  }, [pupilId, enabled, sessionId, intervalMs]);
}
