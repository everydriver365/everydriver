/**
 * Shared speed-limit lookup helper for edge functions.
 * Priority: provider value → Supabase speed_limit_cache → Overpass API → null.
 * Results are cached in the speed_limit_cache table for 30 days.
 */

const GRID_PRECISION = 3; // ~111 m grid cells
const GRID_FACTOR = Math.pow(10, GRID_PRECISION);

function toGrid(v: number): number {
  return Math.round(v * GRID_FACTOR) / GRID_FACTOR;
}

/**
 * Look up the speed limit (km/h) for a coordinate.
 * @param supabase  Service-role Supabase client
 * @param lat       Latitude
 * @param lng       Longitude
 * @param providerValue  Value already supplied by the hardware provider (km/h), if any
 * @returns speed limit in km/h, or null if unknown
 */
export async function resolveSpeedLimit(
  supabase: any,
  lat: number,
  lng: number,
  providerValue: number | null | undefined,
): Promise<number | null> {
  // 1. Use provider value when available
  if (providerValue != null && providerValue > 0) {
    cacheSpeedLimit(supabase, lat, lng, providerValue).catch(() => {});
    return providerValue;
  }

  const gLat = toGrid(lat);
  const gLng = toGrid(lng);

  // 2. Check DB cache
  try {
    const { data } = await supabase
      .from("speed_limit_cache")
      .select("speed_limit_kmh, expires_at")
      .eq("grid_lat", gLat)
      .eq("grid_lng", gLng)
      .maybeSingle();

    if (data && new Date(data.expires_at) > new Date()) {
      return data.speed_limit_kmh;
    }
  } catch {
    // cache miss — continue
  }

  // 3. Overpass API fallback
  try {
    const limit = await fetchFromOverpass(lat, lng);
    if (limit != null) {
      cacheSpeedLimit(supabase, lat, lng, limit).catch(() => {});
      return limit;
    }
  } catch (e) {
    console.warn("[SpeedLimitLookup] Overpass error:", (e as Error).message);
  }

  return null;
}

/** Query Overpass API for the maxspeed tag of the nearest road */
async function fetchFromOverpass(lat: number, lng: number): Promise<number | null> {
  const radius = 30;
  const query = `[out:json][timeout:5];way(around:${radius},${lat},${lng})["highway"]["maxspeed"];out tags 1;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "EveryDriverApp/1.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    await res.text();
    return null;
  }

  const data = await res.json();
  const elements: any[] = data?.elements || [];
  if (elements.length === 0) return null;

  const raw = elements[0]?.tags?.maxspeed;
  if (!raw) return null;

  return parseMaxspeed(String(raw));
}

/** Parse an OSM maxspeed value into km/h */
function parseMaxspeed(raw: string): number | null {
  const mphMatch = raw.match(/^(\d+)\s*mph$/i);
  if (mphMatch) return Math.round(parseInt(mphMatch[1], 10) * 1.60934);

  const numMatch = raw.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);

  if (raw.toLowerCase().includes("national")) return 97; // ~60 mph

  return null;
}

/** Upsert into speed_limit_cache */
async function cacheSpeedLimit(
  supabase: any,
  lat: number,
  lng: number,
  speedLimitKmh: number,
): Promise<void> {
  const gLat = toGrid(lat);
  const gLng = toGrid(lng);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabase.from("speed_limit_cache").upsert(
    {
      grid_lat: gLat,
      grid_lng: gLng,
      speed_limit_kmh: speedLimitKmh,
      source: "overpass",
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "grid_lat,grid_lng", ignoreDuplicates: false },
  );
}
