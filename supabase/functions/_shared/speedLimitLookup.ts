/**
 * Shared speed-limit lookup helper for edge functions.
 * Priority: provider value → Supabase speed_limit_cache → Overpass API → UK road-type defaults → null.
 * Results are cached in the speed_limit_cache table for 30 days (positive) or 24 hours (negative).
 */

const GRID_PRECISION = 3; // ~111 m grid cells
const GRID_FACTOR = Math.pow(10, GRID_PRECISION);
const NEGATIVE_SENTINEL = -1; // Cached "no result" marker

function toGrid(v: number): number {
  return Math.round(v * GRID_FACTOR) / GRID_FACTOR;
}

/**
 * UK National Speed Limit defaults by highway type (km/h).
 * Used when Overpass finds a road but it has no maxspeed tag.
 */
const UK_DEFAULTS: Record<string, number> = {
  motorway: 113,        // 70 mph
  motorway_link: 113,
  trunk: 113,            // 70 mph (single carriageway national limit = 60, but trunk is usually dual)
  trunk_link: 80,        // 50 mph
  primary: 97,           // 60 mph (national speed limit for single carriageway)
  primary_link: 80,
  secondary: 97,         // 60 mph
  secondary_link: 80,
  tertiary: 97,          // 60 mph
  tertiary_link: 48,
  unclassified: 97,      // 60 mph
  residential: 48,       // 30 mph
  living_street: 32,     // 20 mph
  service: 32,           // 20 mph
};

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
    cacheSpeedLimit(supabase, lat, lng, providerValue, "provider").catch(() => {});
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
      // Negative cache hit — we already looked and found nothing
      if (data.speed_limit_kmh === NEGATIVE_SENTINEL) {
        return null;
      }
      return data.speed_limit_kmh;
    }
  } catch {
    // cache miss — continue
  }

  // 3. Overpass API — first try with maxspeed filter
  try {
    const result = await fetchFromOverpass(lat, lng, true);
    if (result?.speedLimit != null) {
      console.log(`[SpeedLimit] Resolved ${result.speedLimit} km/h from maxspeed tag at ${lat},${lng}`);
      cacheSpeedLimit(supabase, lat, lng, result.speedLimit, "overpass-maxspeed").catch(() => {});
      return result.speedLimit;
    }
  } catch (e) {
    console.warn("[SpeedLimitLookup] Overpass maxspeed error:", (e as Error).message);
  }

  // 4. Overpass API — fallback: get road type and infer UK default
  try {
    const result = await fetchFromOverpass(lat, lng, false);
    if (result?.highwayType) {
      const defaultLimit = UK_DEFAULTS[result.highwayType];
      if (defaultLimit) {
        console.log(`[SpeedLimit] Inferred ${defaultLimit} km/h from highway=${result.highwayType} at ${lat},${lng}`);
        cacheSpeedLimit(supabase, lat, lng, defaultLimit, `uk-default-${result.highwayType}`).catch(() => {});
        return defaultLimit;
      }
    }
  } catch (e) {
    console.warn("[SpeedLimitLookup] Overpass highway error:", (e as Error).message);
  }

  // 5. Cache negative result for 24h to avoid repeated lookups
  console.log(`[SpeedLimit] No speed limit found at ${lat},${lng} — caching negative for 24h`);
  cacheNegative(supabase, lat, lng).catch(() => {});

  return null;
}

interface OverpassResult {
  speedLimit: number | null;
  highwayType: string | null;
}

/** Query Overpass API for the nearest road */
async function fetchFromOverpass(
  lat: number,
  lng: number,
  requireMaxspeed: boolean,
): Promise<OverpassResult | null> {
  const radius = 100; // 100m search radius
  const filter = requireMaxspeed
    ? '["highway"]["maxspeed"]'
    : '["highway"]';
  const query = `[out:json][timeout:5];way(around:${radius},${lat},${lng})${filter};out tags 1;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  console.log(`[SpeedLimit] Overpass query (maxspeed=${requireMaxspeed}) for ${lat},${lng}`);

  const res = await fetch(url, {
    headers: { "User-Agent": "EveryDriverApp/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`[SpeedLimit] Overpass HTTP ${res.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  const elements: any[] = data?.elements || [];
  console.log(`[SpeedLimit] Overpass returned ${elements.length} elements`);
  if (elements.length === 0) return null;

  const tags = elements[0]?.tags || {};
  console.log(`[SpeedLimit] First element tags: ${JSON.stringify(tags)}`);
  const raw = tags.maxspeed;
  const highwayType = tags.highway || null;

  return {
    speedLimit: raw ? parseMaxspeed(String(raw)) : null,
    highwayType,
  };
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

/** Upsert positive result into speed_limit_cache (30-day TTL) */
async function cacheSpeedLimit(
  supabase: any,
  lat: number,
  lng: number,
  speedLimitKmh: number,
  source: string,
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
      source,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "grid_lat,grid_lng", ignoreDuplicates: false },
  );
}

/** Upsert negative result into speed_limit_cache (24-hour TTL) */
async function cacheNegative(
  supabase: any,
  lat: number,
  lng: number,
): Promise<void> {
  const gLat = toGrid(lat);
  const gLng = toGrid(lng);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  await supabase.from("speed_limit_cache").upsert(
    {
      grid_lat: gLat,
      grid_lng: gLng,
      speed_limit_kmh: NEGATIVE_SENTINEL,
      source: "negative",
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "grid_lat,grid_lng", ignoreDuplicates: false },
  );
}
