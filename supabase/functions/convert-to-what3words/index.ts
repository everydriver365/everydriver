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
    const body = await req.json();
    const { postcode, latitude, longitude } = body;

    let lat: number | undefined;
    let lng: number | undefined;

    // If lat/lng provided directly, use them
    if (latitude !== undefined && longitude !== undefined) {
      lat = latitude;
      lng = longitude;
    } else if (postcode) {
      // Fall back to postcode lookup
      const postcodeResponse = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`
      );

      if (!postcodeResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid postcode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const postcodeData = await postcodeResponse.json();

      if (!postcodeData.result) {
        return new Response(
          JSON.stringify({ error: "Postcode not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      lat = postcodeData.result.latitude;
      lng = postcodeData.result.longitude;
    } else {
      return new Response(
        JSON.stringify({ error: "Either postcode or latitude/longitude is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wApiKey = Deno.env.get("WHAT3WORDS_API_KEY");
    
    if (!w3wApiKey) {
      return new Response(
        JSON.stringify({ 
          what3words: null, 
          message: "What3Words API key not configured",
          coordinates: { latitude: lat, longitude: lng }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wResponse = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${w3wApiKey}`
    );

    if (!w3wResponse.ok) {
      console.error("What3Words API error:", await w3wResponse.text());
      return new Response(
        JSON.stringify({ 
          what3words: null, 
          message: "What3Words lookup failed",
          coordinates: { latitude: lat, longitude: lng }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wData = await w3wResponse.json();

    return new Response(
      JSON.stringify({ 
        what3words: w3wData.words || null,
        coordinates: { latitude: lat, longitude: lng }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
