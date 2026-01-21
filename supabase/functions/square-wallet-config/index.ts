import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("SQUARE_APPLICATION_ID")?.trim();
    const locationId = Deno.env.get("SQUARE_LOCATION_ID")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";

    if (!appId || !locationId) {
      return new Response(
        JSON.stringify({ error: "Square wallet payments not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        appId,
        locationId,
        environment,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square config error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Square configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
