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
    const { query, placeId, cacheKey, instructorId, mode } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cron mode: refresh every active instructor that has a google_place_id.
    if (mode === "cron") {
      const { data: rows, error } = await supabase
        .from("instructors")
        .select("id, google_place_id")
        .eq("is_active", true)
        .not("google_place_id", "is", null);
      if (error) throw error;

      const results = { total: rows?.length ?? 0, ok: 0, failed: 0, errors: [] as string[] };
      for (const row of rows ?? []) {
        try {
          await refreshOne(supabase, apiKey, row.id, row.google_place_id as string);
          results.ok += 1;
        } catch (e) {
          results.failed += 1;
          results.errors.push(`${row.id}: ${(e as Error).message}`);
        }
      }
      return new Response(JSON.stringify({ mode: "cron", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        if (instructorId) {
          await writeInstructorGoogleSnapshot(supabase, instructorId, {
            placeId: cached.place_id,
            rating: cached.rating,
            count: cached.user_ratings_total,
            reviews: cached.reviews,
          });
        }
        return new Response(
          JSON.stringify({
            cached: true,
            placeName: cached.place_name,
            rating: cached.rating,
            userRatingsTotal: cached.user_ratings_total,
            reviews: cached.reviews,
            photoReference: cached.photo_reference ?? null,
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
    const photoReference = r.photos?.[0]?.photo_reference ?? null;

    await supabase.from("google_place_reviews").upsert(
      {
        cache_key: key,
        place_id: resolvedPlaceId,
        place_name: r.name,
        rating: r.rating ?? null,
        user_ratings_total: r.user_ratings_total ?? null,
        reviews,
        photo_reference: photoReference,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );

    if (instructorId) {
      await writeInstructorGoogleSnapshot(supabase, instructorId, {
        placeId: resolvedPlaceId,
        rating: r.rating ?? null,
        count: r.user_ratings_total ?? null,
        reviews,
      });
    }



    return new Response(
      JSON.stringify({
        cached: false,
        placeName: r.name,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        reviews,
        photoReference,
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

interface GoogleSnapshot {
  placeId: string | null;
  rating: number | null;
  count: number | null;
  reviews: Array<{ author_name?: string; rating?: number; text?: string }>;
}

async function writeInstructorGoogleSnapshot(
  supabase: ReturnType<typeof createClient>,
  instructorId: string,
  snap: GoogleSnapshot
) {
  // Pick the highest-rated review with text as the snippet; tie-break by length.
  const top = (snap.reviews || [])
    .filter((rv) => rv && typeof rv.text === "string" && rv.text!.trim().length > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.text!.length - a.text!.length))[0];

  const snippetRaw = top?.text?.trim() ?? null;
  const snippet =
    snippetRaw && snippetRaw.length > 160
      ? snippetRaw.slice(0, 157).trimEnd() + "…"
      : snippetRaw;

  const author = top?.author_name?.trim() || null;

  const { error } = await supabase
    .from("instructors")
    .update({
      google_place_id: snap.placeId,
      google_rating: snap.rating,
      google_review_count: snap.count,
      google_top_review_text: snippet,
      google_top_review_author: author,
      google_reviews_fetched_at: new Date().toISOString(),
    })
    .eq("id", instructorId);
  if (error) console.error("writeInstructorGoogleSnapshot:", error.message);
}

