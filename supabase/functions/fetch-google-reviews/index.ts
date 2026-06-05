import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, placeId, cacheKey } = await req.json().catch(() => ({}));
    if (!query && !placeId) {
      return new Response(
        JSON.stringify({ error: "query or placeId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const key = cacheKey || placeId || query;

    // Check cache
    const { data: cached } = await supabase
      .from("google_place_reviews")
      .select("*")
      .eq("cache_key", key)
      .maybeSingle();

    if (cached) {
      const ageHours =
        (Date.now() - new Date(cached.fetched_at).getTime()) / 3_600_000;
      if (ageHours < CACHE_TTL_HOURS) {
        return new Response(
          JSON.stringify({
            cached: true,
            placeName: cached.place_name,
            rating: cached.rating,
            userRatingsTotal: cached.user_ratings_total,
            reviews: cached.reviews,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Resolve place_id if not provided
    let resolvedPlaceId = placeId;
    if (!resolvedPlaceId) {
      const findRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          query
        )}&inputtype=textquery&fields=place_id,name&key=${apiKey}`
      );
      const findData = await findRes.json();
      if (findData.status !== "OK" || !findData.candidates?.length) {
        throw new Error(
          `Place not found: ${findData.status} ${findData.error_message ?? ""}`
        );
      }
      resolvedPlaceId = findData.candidates[0].place_id;
    }

    // Fetch details with reviews
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${resolvedPlaceId}&fields=name,rating,user_ratings_total,reviews,photos&reviews_sort=newest&key=${apiKey}`
    );
    const detailsData = await detailsRes.json();
    if (detailsData.status !== "OK") {
      throw new Error(
        `Place details failed: ${detailsData.status} ${
          detailsData.error_message ?? ""
        }`
      );
    }

    const r = detailsData.result;
    const reviews = (r.reviews || []).map((rv: any) => ({
      author_name: rv.author_name,
      profile_photo_url: rv.profile_photo_url,
      rating: rv.rating,
      text: rv.text,
      relative_time_description: rv.relative_time_description,
      time: rv.time,
    }));

    await supabase.from("google_place_reviews").upsert(
      {
        cache_key: key,
        place_id: resolvedPlaceId,
        place_name: r.name,
        rating: r.rating ?? null,
        user_ratings_total: r.user_ratings_total ?? null,
        reviews,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );

    return new Response(
      JSON.stringify({
        cached: false,
        placeName: r.name,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        reviews,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("fetch-google-reviews error:", message);
    return new Response(
      JSON.stringify({ error: message, reviews: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
