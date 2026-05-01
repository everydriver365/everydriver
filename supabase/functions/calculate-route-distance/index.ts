import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeocodeResult {
  lat: number;
  lng: number;
}

async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  try {
    const clean = postcode.replace(/\s+/g, "").toUpperCase();
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
  const R = 3958.7613; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function calculateRoute(
  from: GeocodeResult,
  to: GeocodeResult
): Promise<{ distanceMiles: number; durationMinutes: number; estimated?: boolean }> {
  // Try OSRM with timeout; fall back to haversine on any failure
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.length > 0) {
        const route = data.routes[0];
        return {
          distanceMiles: route.distance / 1609.344,
          durationMinutes: Math.round(route.duration / 60),
        };
      }
    } else {
      console.warn("OSRM unavailable:", res.status);
    }
  } catch (e) {
    console.warn("OSRM failed, using haversine fallback:", (e as Error).message);
  }

  // Haversine fallback: straight-line distance * 1.3 road factor, ~30mph avg
  const straight = haversineMiles(from, to);
  const distanceMiles = straight * 1.3;
  return {
    distanceMiles,
    durationMinutes: Math.round((distanceMiles / 30) * 60),
    estimated: true,
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

    const fromCoords = await geocodePostcode(from_postcode);
    if (!fromCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode from_postcode", from_postcode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const destinationPostcode = to_postcode || instructor_home_postcode;
    if (!destinationPostcode) {
      return new Response(
        JSON.stringify({
          success: true,
          estimated: true,
          distance_miles: 15,
          from_postcode,
          from_coords: fromCoords,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toCoords = await geocodePostcode(destinationPostcode);
    if (!toCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode destination postcode", to_postcode: destinationPostcode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routeResult = await calculateRoute(fromCoords, toCoords);

    const returnDistance =
      instructor_home_postcode && to_postcode !== instructor_home_postcode
        ? routeResult.distanceMiles
        : routeResult.distanceMiles * 2;

    return new Response(
      JSON.stringify({
        success: true,
        estimated: routeResult.estimated ?? false,
        from_postcode,
        to_postcode: destinationPostcode,
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
