import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from_postcode, to_postcode, available_gap_minutes, padding_minutes = 0 } = await req.json();

    if (!from_postcode || !to_postcode) {
      return new Response(
        JSON.stringify({ error: "from_postcode and to_postcode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(from_postcode) || !postcodeRegex.test(to_postcode)) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "invalid_postcode", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode both postcodes using postcodes.io
    const cleanFrom = from_postcode.replace(/\s+/g, "").toUpperCase();
    const cleanTo = to_postcode.replace(/\s+/g, "").toUpperCase();

    const geoRes = await fetch("https://api.postcodes.io/postcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: [cleanFrom, cleanTo] }),
    });

    if (!geoRes.ok) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "geocode_failed", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geoData = await geoRes.json();
    const fromResult = geoData.result?.[0]?.result;
    const toResult = geoData.result?.[1]?.result;

    if (!fromResult || !toResult) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "postcode_not_found", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate travel time using TomTom (same as calculate-route-distance)
    const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY");
    if (!tomtomApiKey) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "no_api_key", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${fromResult.latitude},${fromResult.longitude}:${toResult.latitude},${toResult.longitude}/json?key=${tomtomApiKey}&traffic=true`;
    const routeRes = await fetch(routeUrl);

    if (!routeRes.ok) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "routing_failed", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routeData = await routeRes.json();
    const route = routeData.routes?.[0];
    if (!route) {
      return new Response(
        JSON.stringify({ feasible: true, reason: "no_route", travel_minutes: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const travelMinutes = Math.round(route.summary.travelTimeInSeconds / 60);
    const requiredMinutes = travelMinutes + padding_minutes;
    const feasible = available_gap_minutes == null || available_gap_minutes >= requiredMinutes;

    return new Response(
      JSON.stringify({
        feasible,
        travel_minutes: travelMinutes,
        required_minutes: requiredMinutes,
        available_gap_minutes: available_gap_minutes ?? null,
        buffer_shortfall: feasible ? 0 : requiredMinutes - (available_gap_minutes ?? 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-travel-buffer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
