import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const clean = postcode.replace(/\s+/g, "").toUpperCase();
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupil_id, lesson_id } = await req.json();

    if (!pupil_id || !lesson_id) {
      return new Response(
        JSON.stringify({ error: "Missing pupil_id or lesson_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate lesson belongs to pupil and is en_route
    const { data: lesson, error: lessonErr } = await supabase
      .from("scheduled_lessons")
      .select("id, status, instructor_id, pickup_postcode")
      .eq("id", lesson_id)
      .eq("pupil_id", pupil_id)
      .maybeSingle();

    if (lessonErr || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lesson.status !== "en_route") {
      return new Response(
        JSON.stringify({ error: "Instructor is not en route", status: lesson.status }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get instructor's latest GPS position
    const { data: device } = await supabase
      .from("gps_devices")
      .select("last_latitude, last_longitude, last_heading, last_seen_at, is_active")
      .eq("instructor_id", lesson.instructor_id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!device || !device.last_latitude || !device.last_longitude) {
      return new Response(
        JSON.stringify({ error: "Instructor position unavailable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: Record<string, any> = {
      latitude: Number(device.last_latitude),
      longitude: Number(device.last_longitude),
      heading: device.last_heading ? Number(device.last_heading) : null,
      last_seen_at: device.last_seen_at,
    };

    // Calculate ETA if pickup postcode available
    const pickupPostcode = lesson.pickup_postcode;
    if (pickupPostcode) {
      const hereKey = Deno.env.get("HERE_API_KEY");
      if (hereKey) {
        const destCoords = await geocodePostcode(pickupPostcode);
        if (destCoords) {
          try {
            const routeUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${result.latitude},${result.longitude}&destination=${destCoords.lat},${destCoords.lng}&return=summary&departureTime=${new Date().toISOString()}&apiKey=${hereKey}`;
            const routeRes = await fetch(routeUrl);
            const routeData = await routeRes.json();

            if (routeData.routes?.length > 0) {
              const summary = routeData.routes[0].sections[0].summary;
              const durationMin = Math.round(summary.duration / 60);
              const baseMin = Math.round((summary.baseDuration || summary.duration) / 60);
              const delayMin = durationMin - baseMin;

              let trafficCondition = "clear";
              if (delayMin > 15) trafficCondition = "heavy";
              else if (delayMin > 5) trafficCondition = "moderate";
              else if (delayMin > 1) trafficCondition = "light";

              let etaText: string;
              if (durationMin < 60) {
                etaText = `${durationMin} min`;
              } else {
                const h = Math.floor(durationMin / 60);
                const m = durationMin % 60;
                etaText = m > 0 ? `${h}h ${m}m` : `${h}h`;
              }

              result.eta_minutes = durationMin;
              result.eta_text = etaText;
              result.traffic_condition = trafficCondition;
              result.delay_minutes = delayMin;
            }
          } catch (e) {
            console.error("ETA calculation error:", e);
          }
        }
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
