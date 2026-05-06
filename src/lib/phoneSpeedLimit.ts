import { supabase } from "@/integrations/supabase/client";
import { getCachedSpeedLimit, setCachedSpeedLimit } from "./speedLimitCache";

/**
 * Resolve the speed limit (km/h) for a coordinate during phone-based GPS tracking.
 *
 * Strategy:
 *  1. Local IndexedDB grid cache (~111 m).
 *  2. `resolve-speed-limit` edge function (Overpass + UK defaults + Supabase cache).
 *  3. Result is written back to the local cache for offline reuse.
 *
 * Throttled internally per-coordinate-grid: callers can invoke on every GPS fix.
 */

// In-flight de-dupe — avoid hammering the edge function while the same grid is loading.
const inFlight = new Map<string, Promise<number | null>>();

function gridKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export async function resolvePhoneSpeedLimit(
  lat: number,
  lng: number,
): Promise<number | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // 1. Local cache
  const cached = await getCachedSpeedLimit(lat, lng).catch(() => null);
  if (cached != null) return cached;

  const key = gridKey(lat, lng);
  const existing = inFlight.get(key);
  if (existing) return existing;

  const fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "resolve-speed-limit",
        { body: { lat, lng } },
      );
      if (error) {
        console.warn("[phoneSpeedLimit] edge error:", error.message);
        return null;
      }
      const limit = (data as any)?.speedLimitKmh ?? null;
      if (typeof limit === "number" && limit > 0) {
        setCachedSpeedLimit(lat, lng, limit).catch(() => {});
        return limit;
      }
      return null;
    } catch (err) {
      console.warn("[phoneSpeedLimit] lookup failed:", err);
      return null;
    } finally {
      // Clear after a short delay so concurrent callers piggy-back on the result
      setTimeout(() => inFlight.delete(key), 1500);
    }
  })();

  inFlight.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Lightweight haversine distance in metres.
 */
export function haversineMetres(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
