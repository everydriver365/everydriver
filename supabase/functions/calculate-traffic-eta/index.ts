

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ETARequest {
  origin_lat: number;
  origin_lng: number;
  destination_postcode: string;
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    
    if (!response.ok) {
      console.error(`Failed to geocode postcode: ${postcode}`);
      return null;
    }
    
    const data = await response.json();
    if (data.status === 200 && data.result) {
      return {
        lat: data.result.latitude,
        lng: data.result.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding postcode:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin_lat, origin_lng, destination_postcode } = await req.json() as ETARequest;

    if (!origin_lat || !origin_lng || !destination_postcode) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("HERE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "HERE API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode the destination postcode
    const destCoords = await geocodePostcode(destination_postcode);
    if (!destCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode destination postcode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call HERE Routing API v8 with traffic
    const routeUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin_lat},${origin_lng}&destination=${destCoords.lat},${destCoords.lng}&return=summary&departureTime=${new Date().toISOString()}&apiKey=${apiKey}`;

    const response = await fetch(routeUrl);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error("HERE Routing API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No route found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const section = data.routes[0].sections[0];
    const summary = section.summary;
    
    // duration includes live traffic when departureTime=now
    // baseDuration is the duration without traffic
    const durationSeconds = summary.duration;
    const baseDurationSeconds = summary.baseDuration || durationSeconds;
    const durationMinutes = Math.round(durationSeconds / 60);
    const baseDurationMinutes = Math.round(baseDurationSeconds / 60);
    const distanceKm = (summary.length / 1000).toFixed(1);
    
    // Calculate traffic delay
    const delayMinutes = durationMinutes - baseDurationMinutes;
    
    // Determine traffic condition
    let trafficCondition: string;
    if (delayMinutes <= 1) {
      trafficCondition = "clear";
    } else if (delayMinutes <= 5) {
      trafficCondition = "light";
    } else if (delayMinutes <= 15) {
      trafficCondition = "moderate";
    } else {
      trafficCondition = "heavy";
    }
    
    // Format duration text
    let durationText: string;
    if (durationMinutes < 60) {
      durationText = `${durationMinutes} min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      durationText = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        duration_minutes: durationMinutes,
        duration_text: durationText,
        distance_text: `${distanceKm} km`,
        has_traffic: true,
        traffic_condition: trafficCondition,
        delay_minutes: delayMinutes,
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
