import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "GOOGLE_PLACES_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { points, interpolate = true } = await req.json();

    if (!Array.isArray(points) || points.length < 2) {
      return new Response(
        JSON.stringify({ ok: false, error: "Need at least 2 points" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Google Roads API accepts max 100 points per call
    const batchSize = 100;
    const allSnapped: Array<{ lat: number; lng: number }> = [];

    for (let i = 0; i < points.length; i += batchSize - 1) {
      const batch = points.slice(i, i + batchSize);
      if (batch.length < 2) {
        allSnapped.push(...batch);
        continue;
      }

      const path = batch
        .filter((p: any) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
        .map((p: any) => `${p.lat},${p.lng}`)
        .join("|");

      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=${interpolate}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.error("Roads API error:", res.status, errText);
        // Fall back to raw points for this batch
        allSnapped.push(...batch);
        continue;
      }

      const data = await res.json();
      const snappedPoints = (data.snappedPoints || [])
        .filter((sp: any) => sp?.location)
        .map((sp: any) => ({
          lat: sp.location.latitude,
          lng: sp.location.longitude,
        }));

      if (snappedPoints.length > 0) {
        allSnapped.push(...snappedPoints);
      } else {
        allSnapped.push(...batch);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, snapped: allSnapped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("snap-to-road error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
