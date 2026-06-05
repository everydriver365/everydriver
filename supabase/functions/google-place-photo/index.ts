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
    const url = new URL(req.url);
    const ref = url.searchParams.get("ref");
    const maxwidth = url.searchParams.get("maxwidth") ?? "200";
    if (!ref) {
      return new Response("missing ref", { status: 400, headers: corsHeaders });
    }
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`;
    const res = await fetch(googleUrl, { redirect: "follow" });
    if (!res.ok || !res.body) {
      return new Response("photo fetch failed", { status: 502, headers: corsHeaders });
    }

    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(msg, { status: 500, headers: corsHeaders });
  }
});
