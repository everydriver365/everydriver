/**
 * Shared speed-limit lookup helper for edge functions.
 * Priority: provider value → Supabase speed_limit_cache → Overpass API → UK road-type defaults → null.
 */

const GRID_PRECISION = 4; // ~11 m grid cells (was 3 / ~111 m which collided neighbouring roads)
const GRID_FACTOR = Math.pow(10, GRID_PRECISION);
const NEGATIVE_SENTINEL = -1;

const POSITIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (was 30)
const NEGATIVE_TTL_MS = 2 * 60 * 60 * 1000;      // 2 hours (was 24)

function toGrid(v: number): number {
  return Math.round(v * GRID_FACTOR) / GRID_FACTOR;
}

/**
 * UK speed-limit defaults by road class (km/h). These are RURAL national-speed
 * baselines; urban contexts (lit / built-up / residential) drop to 30 mph.
 */
const UK_RURAL_DEFAULTS: Record<string, number> = {
  motorway: 113,        // 70 mph
  motorway_link: 113,
  trunk: 97,             // 60 mph single carriageway (most UK trunks)
  trunk_link: 80,        // 50 mph
  primary: 97,
  primary_link: 80,
  secondary: 97,
  secondary_link: 80,
  tertiary: 97,
  tertiary_link: 64,     // 40 mph
  unclassified: 97,
  residential: 48,       // 30 mph
  living_street: 32,     // 20 mph
  service: 32,
};

const URBAN_DEFAULT = 48; // 30 mph
const NON_DRIVABLE = new Set([
  "footway", "cycleway", "path", "pedestrian", "steps",
  "bridleway", "track", "corridor", "platform", "construction",
  "proposed", "raceway",
]);

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

  // 2. DB cache
  try {
    const { data } = await supabase
      .from("speed_limit_cache")
      .select("speed_limit_kmh, expires_at")
      .eq("grid_lat", gLat)
      .eq("grid_lng", gLng)
      .maybeSingle();

    if (data && new Date(data.expires_at) > new Date()) {
      if (data.speed_limit_kmh === NEGATIVE_SENTINEL) return null;
      return data.speed_limit_kmh;
    }
  } catch {/* miss — continue */}

  // 3. TomTom reverse geocode — authoritative posted speed limits
  try {
    const tomtom = await fetchTomTomSpeedLimit(lat, lng);
    if (tomtom) {
      console.log(`[SpeedLimit] tomtom → ${tomtom} km/h at ${lat},${lng}`);
      cacheSpeedLimit(supabase, lat, lng, tomtom, "tomtom").catch(() => {});
      return tomtom;
    }
  } catch (e) {
    console.warn("[SpeedLimitLookup] TomTom error:", (e as Error).message);
  }

  // 4. Overpass — single query with geometry + tags, pick nearest drivable way
  try {
    const candidate = await fetchNearestRoad(lat, lng);
    if (candidate) {
      const { tags } = candidate;
      const fromTag = tags.maxspeed ? parseMaxspeed(String(tags.maxspeed)) : null;
      if (fromTag) {
        console.log(`[SpeedLimit] maxspeed=${tags.maxspeed} → ${fromTag} km/h at ${lat},${lng}`);
        cacheSpeedLimit(supabase, lat, lng, fromTag, "overpass-maxspeed").catch(() => {});
        return fromTag;
      }

      const highway = tags.highway as string | undefined;
      if (highway) {
        const isUrban =
          tags.lit === "yes" ||
          (typeof tags["maxspeed:type"] === "string" && /urban/i.test(tags["maxspeed:type"])) ||
          highway === "residential" ||
          highway === "living_street";
        const isDualOrMotorroad =
          tags.dual_carriageway === "yes" || tags.motorroad === "yes" || highway === "motorway";

        let inferred: number | null = null;
        if (isUrban && highway !== "motorway" && highway !== "trunk") {
          inferred = URBAN_DEFAULT;
        } else if (highway === "trunk" && isDualOrMotorroad) {
          inferred = 113;
        } else {
          inferred = UK_RURAL_DEFAULTS[highway] ?? null;
        }

        if (inferred) {
          console.log(`[SpeedLimit] highway=${highway} urban=${isUrban} → ${inferred} km/h at ${lat},${lng}`);
          cacheSpeedLimit(supabase, lat, lng, inferred, `uk-${isUrban ? "urban" : "default"}-${highway}`).catch(() => {});
          return inferred;
        }
      }
    }
  } catch (e) {
    console.warn("[SpeedLimitLookup] Overpass error:", (e as Error).message);
  }

  // 4. Negative cache
  console.log(`[SpeedLimit] No limit found at ${lat},${lng}`);
  cacheNegative(supabase, lat, lng).catch(() => {});
  return null;
}

interface RoadCandidate {
  tags: Record<string, any>;
  distanceM: number;
}

async function fetchNearestRoad(lat: number, lng: number): Promise<RoadCandidate | null> {
  const radius = 25; // tightened from 100m
  const query = `[out:json][timeout:10];way(around:${radius},${lat},${lng})["highway"];out tags geom 8;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "User-Agent": "EveryDriverApp/1.0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    console.warn(`[SpeedLimit] Overpass HTTP ${res.status}`);
    return null;
  }

  const data = await res.json();
  const elements: any[] = data?.elements || [];
  if (!elements.length) return null;

  let best: RoadCandidate | null = null;
  for (const el of elements) {
    const tags = el.tags || {};
    const hw = tags.highway;
    if (!hw || NON_DRIVABLE.has(hw)) continue;

    const geom: Array<{ lat: number; lon: number }> = el.geometry || [];
    let minDist = Number.POSITIVE_INFINITY;
    for (const pt of geom) {
      const d = haversineMetres(lat, lng, pt.lat, pt.lon);
      if (d < minDist) minDist = d;
    }
    if (!Number.isFinite(minDist)) continue;

    if (!best || minDist < best.distanceM) {
      best = { tags, distanceM: minDist };
    }
  }
  return best;
}

function haversineMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
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

function parseMaxspeed(raw: string): number | null {
  const mphMatch = raw.match(/^(\d+)\s*mph$/i);
  if (mphMatch) return Math.round(parseInt(mphMatch[1], 10) * 1.60934);
  const numMatch = raw.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (raw.toLowerCase().includes("national")) return 97;
  return null;
}

async function fetchTomTomSpeedLimit(lat: number, lng: number): Promise<number | null> {
  const key = Deno.env.get("TOMTOM_API_KEY");
  if (!key) return null;
  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${key}&returnSpeedLimit=true&radius=25`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    console.warn(`[SpeedLimit] TomTom HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  const raw = data?.addresses?.[0]?.address?.speedLimit;
  return raw ? parseTomTomSpeed(String(raw)) : null;
}

function parseTomTomSpeed(raw: string): number | null {
  const m = raw.match(/^(\d+)\s*(MPH|KMH|KPH)?$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || "KMH").toUpperCase();
  return unit === "MPH" ? Math.round(n * 1.60934) : n;
}

async function cacheSpeedLimit(
  supabase: any, lat: number, lng: number, speedLimitKmh: number, source: string,
): Promise<void> {
  const now = new Date();
  await supabase.from("speed_limit_cache").upsert({
    grid_lat: toGrid(lat),
    grid_lng: toGrid(lng),
    speed_limit_kmh: speedLimitKmh,
    source,
    fetched_at: now.toISOString(),
    expires_at: new Date(now.getTime() + POSITIVE_TTL_MS).toISOString(),
  }, { onConflict: "grid_lat,grid_lng", ignoreDuplicates: false });
}

async function cacheNegative(supabase: any, lat: number, lng: number): Promise<void> {
  const now = new Date();
  await supabase.from("speed_limit_cache").upsert({
    grid_lat: toGrid(lat),
    grid_lng: toGrid(lng),
    speed_limit_kmh: NEGATIVE_SENTINEL,
    source: "negative",
    fetched_at: now.toISOString(),
    expires_at: new Date(now.getTime() + NEGATIVE_TTL_MS).toISOString(),
  }, { onConflict: "grid_lat,grid_lng", ignoreDuplicates: false });
}
