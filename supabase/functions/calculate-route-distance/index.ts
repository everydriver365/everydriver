import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_DAYS = 30;
const FALLBACK_MINUTES = 10;

type Source = "tomtom" | "osrm" | "cache" | "fallback";

interface GeocodeResult {
  lat: number;
  lng: number;
}

function normalisePostcode(pc: string): string {
  return pc.replace(/\s+/g, "").toUpperCase();
}

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

async function readCache(
  fromPc: string,
  toPc: string,
): Promise<{ duration_minutes: number; distance_miles: number | null } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("route_distance_cache")
      .select("duration_minutes, distance_miles, fetched_at")
      .eq("from_postcode", fromPc)
      .eq("to_postcode", toPc)
      .maybeSingle();
    if (error || !data) return null;
    const ageMs = Date.now() - new Date(data.fetched_at).getTime();
    if (ageMs > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) return null;
    return {
      duration_minutes: data.duration_minutes,
      distance_miles: data.distance_miles == null ? null : Number(data.distance_miles),
    };
  } catch (e) {
    console.warn("cache read failed:", (e as Error).message);
    return null;
  }
}

async function writeCache(
  fromPc: string,
  toPc: string,
  durationMin: number,
  distanceMiles: number | null,
  source: Exclude<Source, "fallback" | "cache">,
): Promise<void> {
  try {
    await supabaseAdmin
      .from("route_distance_cache")
      .upsert(
        {
          from_postcode: fromPc,
          to_postcode: toPc,
          duration_minutes: durationMin,
          distance_miles: distanceMiles,
          source,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "from_postcode,to_postcode" },
      );
  } catch (e) {
    console.warn("cache write failed:", (e as Error).message);
  }
}

async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  try {
    const clean = normalisePostcode(postcode);
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

function haversineMiles(from: GeocodeResult, to: GeocodeResult): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function tomtomRoute(
  from: GeocodeResult,
  to: GeocodeResult,
): Promise<{ distanceMiles: number; durationMinutes: number } | null> {
  const key = Deno.env.get("TOMTOM_API_KEY");
  if (!key) {
    console.warn("TOMTOM_API_KEY missing — skipping TomTom, falling through to OSRM");
    return null;
  }
  try {
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json` +
      `?key=${key}&traffic=true&routeType=fastest`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn("TomTom returned", res.status);
      return null;
    }
    const data = await res.json();
    const summary = data.routes?.[0]?.summary;
    if (!summary) return null;
    return {
      distanceMiles: summary.lengthInMeters / 1609.344,
      durationMinutes: Math.round(summary.travelTimeInSeconds / 60),
    };
  } catch (e) {
    console.warn("TomTom failed:", (e as Error).message);
    return null;
  }
}

async function osrmRoute(
  from: GeocodeResult,
  to: GeocodeResult,
): Promise<{ distanceMiles: number; durationMinutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn("OSRM unavailable:", res.status);
      return null;
    }
    const data = await res.json();
    const route = data?.code === "Ok" ? data.routes?.[0] : null;
    if (!route) return null;
    return {
      distanceMiles: route.distance / 1609.344,
      durationMinutes: Math.round(route.duration / 60),
    };
  } catch (e) {
    console.warn("OSRM failed:", (e as Error).message);
    return null;
  }
}

async function resolveRoute(
  fromPc: string,
  toPc: string,
  from: GeocodeResult,
  to: GeocodeResult,
): Promise<{ distanceMiles: number; durationMinutes: number; source: Source }> {
  // 1. TomTom (preferred, traffic-aware)
  const tomtom = await tomtomRoute(from, to);
  if (tomtom) {
    await writeCache(fromPc, toPc, tomtom.durationMinutes, tomtom.distanceMiles, "tomtom");
    return { ...tomtom, source: "tomtom" };
  }
  // 2. OSRM (free fallback)
  const osrm = await osrmRoute(from, to);
  if (osrm) {
    await writeCache(fromPc, toPc, osrm.durationMinutes, osrm.distanceMiles, "osrm");
    return { ...osrm, source: "osrm" };
  }
  // 3. Haversine fallback — never written to cache so we retry on next call
  const straight = haversineMiles(from, to);
  const distanceMiles = straight * 1.3;
  return {
    distanceMiles,
    durationMinutes: Math.round((distanceMiles / 30) * 60) || FALLBACK_MINUTES,
    source: "fallback",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from_postcode, to_postcode, instructor_home_postcode } = await req.json();

    if (!from_postcode) {
      return new Response(
        JSON.stringify({ error: "from_postcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromPc = normalisePostcode(from_postcode);
    if (!UK_POSTCODE_RE.test(fromPc)) {
      return new Response(
        JSON.stringify({ error: "Invalid from_postcode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const destinationPostcodeRaw = to_postcode || instructor_home_postcode;
    if (!destinationPostcodeRaw) {
      // Caller wants only the from_coords lookup (legacy path)
      const fromCoords = await geocodePostcode(fromPc);
      if (!fromCoords) {
        return new Response(
          JSON.stringify({ error: "Could not geocode from_postcode", from_postcode }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          estimated: true,
          distance_miles: 15,
          from_postcode: fromPc,
          from_coords: fromCoords,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toPc = normalisePostcode(destinationPostcodeRaw);
    if (!UK_POSTCODE_RE.test(toPc)) {
      return new Response(
        JSON.stringify({ error: "Invalid to_postcode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Same postcode: short-circuit (don't waste cache space or API calls)
    if (fromPc === toPc) {
      return new Response(
        JSON.stringify({
          success: true,
          source: "cache",
          from_postcode: fromPc,
          to_postcode: toPc,
          one_way_miles: 0,
          estimated_lesson_miles: 0,
          duration_minutes: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Cache lookup
    const cached = await readCache(fromPc, toPc);
    if (cached) {
      const oneWay = cached.distance_miles ?? 0;
      const returnDistance =
        instructor_home_postcode && toPc !== normalisePostcode(instructor_home_postcode)
          ? oneWay
          : oneWay * 2;
      return new Response(
        JSON.stringify({
          success: true,
          source: "cache",
          estimated: false,
          from_postcode: fromPc,
          to_postcode: toPc,
          one_way_miles: Number(oneWay.toFixed(1)),
          estimated_lesson_miles: Number(returnDistance.toFixed(1)),
          duration_minutes: cached.duration_minutes,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Geocode both ends
    const [fromCoords, toCoords] = await Promise.all([
      geocodePostcode(fromPc),
      geocodePostcode(toPc),
    ]);
    if (!fromCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode from_postcode", from_postcode: fromPc }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!toCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode destination postcode", to_postcode: toPc }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. TomTom → OSRM → haversine
    const routeResult = await resolveRoute(fromPc, toPc, fromCoords, toCoords);

    const returnDistance =
      instructor_home_postcode && toPc !== normalisePostcode(instructor_home_postcode)
        ? routeResult.distanceMiles
        : routeResult.distanceMiles * 2;

    return new Response(
      JSON.stringify({
        success: true,
        source: routeResult.source,
        estimated: routeResult.source === "fallback",
        from_postcode: fromPc,
        to_postcode: toPc,
        one_way_miles: Number(routeResult.distanceMiles.toFixed(1)),
        estimated_lesson_miles: Number(returnDistance.toFixed(1)),
        duration_minutes: routeResult.durationMinutes,
        from_coords: fromCoords,
        to_coords: toCoords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
