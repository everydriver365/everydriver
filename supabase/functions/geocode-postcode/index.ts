import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PostcodeResult {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  area_name: string | null;
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

    // Map results - include admin_district as area_name
    const results: PostcodeResult[] = data.result.map((item: any) => ({
      postcode: item.query,
      latitude: item.result?.latitude || null,
      longitude: item.result?.longitude || null,
      area_name: item.result?.admin_district || item.result?.admin_ward || null,
    }));

    // Fallback: for any postcode that failed to resolve, try the outcode
    // (district) centroid via postcodes.io /outcodes/{outcode}. This means a
    // typo'd inward code (e.g. "WD17 3XX") still returns the district
    // coordinates so the radius/placeholder search can proceed.
    const outcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)/;
    await Promise.all(
      results.map(async (r) => {
        if (r.latitude && r.longitude) return;
        const m = r.postcode.match(outcodeRegex);
        if (!m) return;
        const outcode = m[1];
        try {
          const res = await fetch(`https://api.postcodes.io/outcodes/${outcode}`);
          if (!res.ok) return;
          const body = await res.json();
          if (body?.result?.latitude && body?.result?.longitude) {
            r.latitude = body.result.latitude;
            r.longitude = body.result.longitude;
            r.area_name = r.area_name
              || (body.result.admin_district && body.result.admin_district[0])
              || (body.result.admin_ward && body.result.admin_ward[0])
              || null;
          }
        } catch (_e) {
          // ignore, leave nulls
        }
      })
    );

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
