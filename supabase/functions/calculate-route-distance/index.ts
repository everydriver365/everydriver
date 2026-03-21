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

async function calculateRoute(
  from: GeocodeResult,
  to: GeocodeResult
): Promise<{ distanceMiles: number; durationMinutes: number } | null> {
  try {
    // Use free OSRM routing API
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("OSRM error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.length > 0) {
      const route = data.routes[0];
      return {
        distanceMiles: (route.distance / 1609.344),
        durationMinutes: Math.round(route.duration / 60),
      };
    }
    return null;
  } catch (e) {
    console.error("Route calc error:", e);
    return null;
  }
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
    if (!routeResult) {
      return new Response(
        JSON.stringify({ error: "Could not calculate route" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const returnDistance =
      instructor_home_postcode && to_postcode !== instructor_home_postcode
        ? routeResult.distanceMiles
        : routeResult.distanceMiles * 2;

    return new Response(
      JSON.stringify({
        success: true,
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
