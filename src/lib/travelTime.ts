// =============================================================================
// travelTime.ts — postcode-to-postcode drive-time estimator
// =============================================================================
//
// Used by the availability engine to inject synthetic "travel" conflicts
// between consecutive booked lessons so candidate slots cannot start at a
// location the instructor cannot realistically reach in time.
//
// Strategy:
//   1. Coordinates come from `scheduled_lessons.pickup_lat/lng` (and dropoff
//      coords when present), stamped at booking time. No HTTP at compute time.
//   2. Drive minutes = haversine miles ÷ UK average drive speed (configurable).
//      This is intentionally conservative: real drive time is usually within
//      ±20% of this for urban/suburban journeys < 20 miles.
//   3. A small fixed park-and-handover overhead is added to every estimate.
//
// `postcodes.io` is used ONCE per page-load to geocode the pupil's postcode.
// Everything else operates on the pre-stored coordinates, so the engine stays
// pure (no async I/O during slot computation).
// =============================================================================

export interface LatLng {
  lat: number;
  lng: number;
}

/** UK average door-to-door driving speed for short urban/suburban hops. */
const AVG_MPH = 22;

/** Park, swap pupil, set up — added to every estimate. */
const HANDOVER_MIN = 3;

const EARTH_MILES = 3958.8;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Estimate drive time in whole minutes (rounded up). */
export function estimateDriveMinutes(from: LatLng, to: LatLng): number {
  const miles = haversineMiles(from, to);
  const minutes = (miles / AVG_MPH) * 60 + HANDOVER_MIN;
  return Math.ceil(minutes);
}

// ---------------------------------------------------------------------------
// Postcode geocoding (browser-side, cached for the session)
// ---------------------------------------------------------------------------

const geocodeCache = new Map<string, LatLng | null>();

export async function geocodePostcode(postcode: string): Promise<LatLng | null> {
  const key = postcode.trim().toUpperCase().replace(/\s+/g, "");
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!r.ok) {
      geocodeCache.set(key, null);
      return null;
    }
    const j = await r.json();
    const lat = j?.result?.latitude;
    const lng = j?.result?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      const coords = { lat, lng };
      geocodeCache.set(key, coords);
      return coords;
    }
  } catch {
    // network failure — cache null so we don't retry in a loop
  }
  geocodeCache.set(key, null);
  return null;
}
