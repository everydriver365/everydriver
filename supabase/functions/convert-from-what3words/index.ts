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
    const { words } = await req.json();

    if (!words) {
      return new Response(
        JSON.stringify({ error: "What3Words address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the input - remove leading slashes if present
    const cleanWords = words.replace(/^\/+/, '').trim();

    // Validate format (three words separated by dots)
    const w3wRegex = /^[a-z]+\.[a-z]+\.[a-z]+$/i;
    if (!w3wRegex.test(cleanWords)) {
      return new Response(
        JSON.stringify({ error: "Invalid What3Words format. Expected: word.word.word" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wApiKey = Deno.env.get("WHAT3WORDS_API_KEY");
    
    if (!w3wApiKey) {
      console.log("WHAT3WORDS_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "What3Words API key not configured",
          message: "Please add WHAT3WORDS_API_KEY to use this feature"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Converting What3Words: ${cleanWords}`);

    const w3wResponse = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(cleanWords)}&key=${w3wApiKey}`
    );

    if (!w3wResponse.ok) {
      const errorText = await w3wResponse.text();
      console.error("What3Words API error:", errorText);
      return new Response(
        JSON.stringify({ error: "What3Words lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const w3wData = await w3wResponse.json();

    if (w3wData.error) {
      console.error("What3Words returned error:", w3wData.error);
      return new Response(
        JSON.stringify({ error: w3wData.error.message || "Invalid What3Words address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Resolved coordinates: ${w3wData.coordinates?.lat}, ${w3wData.coordinates?.lng}`);

    return new Response(
      JSON.stringify({ 
        latitude: w3wData.coordinates?.lat,
        longitude: w3wData.coordinates?.lng,
        words: w3wData.words,
        nearestPlace: w3wData.nearestPlace,
        country: w3wData.country
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
