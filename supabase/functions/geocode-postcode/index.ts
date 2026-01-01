import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PostcodeResult {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postcodes } = await req.json();

    if (!postcodes || !Array.isArray(postcodes) || postcodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "postcodes array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean postcodes (remove spaces, uppercase)
    const cleanedPostcodes = postcodes.map((p: string) => p.replace(/\s+/g, "").toUpperCase());

    // Use postcodes.io bulk lookup (free, no API key required)
    const response = await fetch("https://api.postcodes.io/postcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: cleanedPostcodes }),
    });

    if (!response.ok) {
      throw new Error(`Postcodes API error: ${response.status}`);
    }

    const data = await response.json();

    // Map results
    const results: PostcodeResult[] = data.result.map((item: any) => ({
      postcode: item.query,
      latitude: item.result?.latitude || null,
      longitude: item.result?.longitude || null,
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
