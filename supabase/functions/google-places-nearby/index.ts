import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { lat, lng, category } = await req.json();

    if (!lat || !lng || !category) {
      return new Response(
        JSON.stringify({ error: "Missing lat, lng, or category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Category mapping
    const categoryMap: Record<string, { type?: string; keyword?: string }> = {
      toilet: { keyword: "public toilet" },
      mcdonalds: { keyword: "McDonalds" },
      petrol: { type: "gas_station" },
      ae: { keyword: "accident emergency hospital" },
      defib: { keyword: "defibrillator" },
      coffee: { type: "cafe", keyword: "coffee" },
      supermarket: { type: "supermarket" },
      pharmacy: { type: "pharmacy" },
      "car-wash": { keyword: "car wash" },
      parking: { type: "parking" },
      garage: { keyword: "tyre garage car repair" },
      atm: { type: "atm" },
      "ev-charging": { keyword: "electric vehicle charging station" },
      "post-office": { keyword: "post office" },
    };

    const mapping = categoryMap[category];
    if (!mapping) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      rankby: "distance",
      key: apiKey,
    });

    if (mapping.type) params.append("type", mapping.type);
    if (mapping.keyword) params.append("keyword", mapping.keyword);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
    );
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places Nearby error:", data);
      throw new Error(data.error_message || `API returned status: ${data.status}`);
    }

    // Calculate distance using Haversine formula
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 3958.8; // miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const places = (data.results || []).slice(0, 15).map((p: any) => ({
      name: p.name,
      address: p.vicinity || "",
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      distance: haversine(lat, lng, p.geometry?.location?.lat, p.geometry?.location?.lng),
      open_now: p.opening_hours?.open_now ?? null,
      rating: p.rating ?? null,
    }));

    return new Response(
      JSON.stringify({ places }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in google-places-nearby:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, places: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
