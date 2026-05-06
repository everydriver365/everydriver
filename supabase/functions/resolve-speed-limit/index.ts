import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveSpeedLimit } from "../_shared/speedLimitLookup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let lat: number | null = null;
    let lng: number | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      lat = Number(body.lat);
      lng = Number(body.lng);
    } else {
      lat = Number(url.searchParams.get("lat"));
      lng = Number(url.searchParams.get("lng"));
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(
        JSON.stringify({ error: "lat/lng required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const speedLimitKmh = await resolveSpeedLimit(supabase, lat!, lng!, null);

    return new Response(
      JSON.stringify({ speedLimitKmh }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[resolve-speed-limit] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
