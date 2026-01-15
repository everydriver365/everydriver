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
    const { input, sessionToken } = await req.json();

    if (!input || input.length < 3) {
      return new Response(
        JSON.stringify({ predictions: [], error: "Input too short" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("Google Places API key not configured");
    }

    // Use the Places Autocomplete API
    const params = new URLSearchParams({
      input,
      key: apiKey,
      types: "address",
      components: "country:gb", // UK addresses only
    });

    if (sessionToken) {
      params.append("sessiontoken", sessionToken);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data);
      throw new Error(data.error_message || `API returned status: ${data.status}`);
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || "",
      secondaryText: p.structured_formatting?.secondary_text || "",
    }));

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in google-places-autocomplete:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, predictions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
