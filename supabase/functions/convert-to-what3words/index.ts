import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postcode } = await req.json();

    if (!postcode) {
      return new Response(
        JSON.stringify({ error: "Postcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, get coordinates from postcode using postcodes.io
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

    const { latitude, longitude } = postcodeData.result;

    // Use What3Words API to convert coordinates
    const w3wApiKey = Deno.env.get("WHAT3WORDS_API_KEY");
    
    if (!w3wApiKey) {
      // Return a placeholder if no API key - instructors can enter manually
      return new Response(
        JSON.stringify({ 
          what3words: null, 
          message: "What3Words API key not configured",
          coordinates: { latitude, longitude }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wResponse = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?coordinates=${latitude},${longitude}&key=${w3wApiKey}`
    );

    if (!w3wResponse.ok) {
      console.error("What3Words API error:", await w3wResponse.text());
      return new Response(
        JSON.stringify({ 
          what3words: null, 
          message: "What3Words lookup failed",
          coordinates: { latitude, longitude }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wData = await w3wResponse.json();

    return new Response(
      JSON.stringify({ 
        what3words: w3wData.words || null,
        coordinates: { latitude, longitude }
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