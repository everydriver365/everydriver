import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
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

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google API key not configured" }),
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

    // Call Google Directions API with traffic
    const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
    directionsUrl.searchParams.set("origin", `${origin_lat},${origin_lng}`);
    directionsUrl.searchParams.set("destination", `${destCoords.lat},${destCoords.lng}`);
    directionsUrl.searchParams.set("mode", "driving");
    directionsUrl.searchParams.set("departure_time", "now");
    directionsUrl.searchParams.set("traffic_model", "best_guess");
    directionsUrl.searchParams.set("key", apiKey);

    const response = await fetch(directionsUrl.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Directions API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: `Directions API error: ${data.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    
    // Use duration_in_traffic if available, otherwise use regular duration
    const duration = leg.duration_in_traffic || leg.duration;
    const durationMinutes = Math.round(duration.value / 60);

    return new Response(
      JSON.stringify({
        success: true,
        duration_minutes: durationMinutes,
        duration_text: duration.text,
        distance_text: leg.distance.text,
        has_traffic: !!leg.duration_in_traffic,
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
