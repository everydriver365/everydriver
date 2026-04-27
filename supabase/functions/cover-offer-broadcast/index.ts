/**
 * cover-offer-broadcast
 * --------------------------------------------------------------
 * Creates a cover_offers row for a given lesson and fans out to
 * nearby instructors who opted in. Sends WhatsApp via existing
 * WHATSAPP_BUSINESS_TOKEN if available, falls back to SMS.
 *
 * POST body: { lesson_id: uuid, expires_in_minutes?: number, notes?: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const haversineMiles = (la1: number, lo1: number, la2: number, lo2: number) => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(la2 - la1);
  const dLon = toRad(lo2 - lo1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { lesson_id, expires_in_minutes = 120, notes } = body;
    if (!lesson_id) {
      return new Response(JSON.stringify({ error: "lesson_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Resolve requesting instructor from JWT
    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id, name, lat, lng")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    if (!instructorRow) {
      return new Response(JSON.stringify({ error: "Instructor profile not found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup lesson
    const { data: lesson, error: lessonErr } = await admin
      .from("scheduled_lessons")
      .select("id, instructor_id, pupil_id, start_time, duration, total_price, pickup_lat, pickup_lng, pickup_postcode")
      .eq("id", lesson_id)
      .maybeSingle();
    if (lessonErr || !lesson) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lesson.instructor_id !== instructorRow.id) {
      return new Response(JSON.stringify({ error: "Not your lesson" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pickupLat = lesson.pickup_lat ?? instructorRow.lat;
    const pickupLng = lesson.pickup_lng ?? instructorRow.lng;

    // Upsert cover offer
    const expiresAt = new Date(Date.now() + expires_in_minutes * 60_000).toISOString();
    const { data: existing } = await admin
      .from("cover_offers")
      .select("id")
      .eq("lesson_id", lesson_id)
      .eq("status", "open")
      .maybeSingle();

    let offerId = existing?.id;
    if (!offerId) {
      const { data: created, error: createErr } = await admin
        .from("cover_offers")
        .insert({
          lesson_id,
          requesting_instructor_id: instructorRow.id,
          pupil_id: lesson.pupil_id,
          lesson_start: lesson.start_time,
          lesson_duration_minutes: lesson.duration ?? 60,
          lesson_price: lesson.total_price,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          pickup_postcode: lesson.pickup_postcode,
          expires_at: expiresAt,
          notes,
        })
        .select("id")
        .single();
      if (createErr) throw createErr;
      offerId = created.id;
    }

    // Find candidate instructors
    const { data: candidates } = await admin
      .from("instructors")
      .select("id, name, lat, lng, phone, cover_max_distance_miles, accepts_cover_lessons, cover_min_notice_hours")
      .eq("accepts_cover_lessons", true)
      .neq("id", instructorRow.id);

    const lessonStartMs = new Date(lesson.start_time).getTime();
    const noticeHours = (lessonStartMs - Date.now()) / 3_600_000;
    const targets: { id: string; phone: string | null; distance: number; name: string }[] = [];

    if (pickupLat != null && pickupLng != null && candidates) {
      for (const c of candidates) {
        if (c.lat == null || c.lng == null) continue;
        if (noticeHours < (c.cover_min_notice_hours ?? 2)) continue;
        const d = haversineMiles(Number(pickupLat), Number(pickupLng), Number(c.lat), Number(c.lng));
        if (d <= (c.cover_max_distance_miles ?? 10)) {
          targets.push({ id: c.id, phone: c.phone, distance: d, name: c.name });
        }
      }
    }

    // Insert recipients (idempotent)
    if (targets.length > 0) {
      await admin.from("cover_offer_recipients").upsert(
        targets.map((t) => ({
          cover_offer_id: offerId,
          instructor_id: t.id,
          distance_miles: Number(t.distance.toFixed(2)),
        })),
        { onConflict: "cover_offer_id,instructor_id" },
      );
    }

    // Send notifications via Twilio (best-effort)
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
    let smsSent = 0;
    if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
      for (const t of targets.slice(0, 50)) {
        if (!t.phone) continue;
        const msg = `Cover lesson available: ${lesson.duration ?? 60}min, £${Number(lesson.total_price ?? 0).toFixed(0)}, ${t.distance.toFixed(1)} miles. Tap to claim: https://drive365.co.uk/instructor/cover/${offerId}`;
        try {
          const resp = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
              },
              body: new URLSearchParams({ To: t.phone, From: TWILIO_FROM, Body: msg }),
            },
          );
          if (resp.ok) smsSent++;
        } catch (_) { /* swallow */ }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        offer_id: offerId,
        recipients: targets.length,
        sms_sent: smsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[cover-offer-broadcast]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
