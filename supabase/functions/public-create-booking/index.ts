// External-partner booking endpoint.
// Called by a separate Lovable project; authenticated via x-partner-key header
// against the EXTERNAL_BOOKING_PARTNER_KEYS secret (JSON: { "<partner_key>": "<shared-secret>" }).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-partner-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Body {
  partner_key: string;
  instructor_id: string;
  pupil: { name: string; email: string; phone?: string; postcode?: string };
  start_at: string; // ISO datetime
  duration_minutes: number;
  pickup_location?: string;
  pickup_postcode?: string;
  notes?: string;
  lesson_type?: string;
}

function verifyPartner(partnerKey: string, sharedSecret: string): boolean {
  const raw = Deno.env.get("EXTERNAL_BOOKING_PARTNER_KEYS");
  if (!raw) return false;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const expected = map[partnerKey];
    return typeof expected === "string" && expected.length > 0 && expected === sharedSecret;
  } catch {
    return false;
  }
}

async function geocodePostcode(pc?: string): Promise<{ lat: number; lng: number } | null> {
  if (!pc) return null;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const j = await r.json();
    if (j?.result?.latitude && j?.result?.longitude) {
      return { lat: j.result.latitude, lng: j.result.longitude };
    }
  } catch (_) { /* ignore */ }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const sharedSecret = req.headers.get("x-partner-key") || "";
    const body = (await req.json()) as Body;

    if (!body?.partner_key || !sharedSecret || !verifyPartner(body.partner_key, sharedSecret)) {
      return json({ error: "Invalid partner credentials" }, 401);
    }
    if (!body.instructor_id || !body.pupil?.name || !body.pupil?.email || !body.start_at || !body.duration_minutes) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (body.duration_minutes < 30 || body.duration_minutes > 480) {
      return json({ error: "duration_minutes must be 30–480" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify allow-list
    const { data: allow, error: allowErr } = await admin
      .from("external_booking_allowlist")
      .select("id")
      .eq("partner_key", body.partner_key)
      .eq("instructor_id", body.instructor_id)
      .eq("is_active", true)
      .maybeSingle();
    if (allowErr) throw allowErr;
    if (!allow) return json({ error: "Instructor not bookable via this partner" }, 403);

    // Load instructor for pricing
    const { data: instructor, error: instErr } = await admin
      .from("instructors")
      .select("id, hourly_rate, is_active")
      .eq("id", body.instructor_id)
      .maybeSingle();
    if (instErr) throw instErr;
    if (!instructor || instructor.is_active === false) {
      return json({ error: "Instructor unavailable" }, 404);
    }

    const startDate = new Date(body.start_at);
    if (Number.isNaN(startDate.getTime())) return json({ error: "Invalid start_at" }, 400);
    const endDate = new Date(startDate.getTime() + body.duration_minutes * 60_000);

    // Conflict check — Google Calendar + manual blocks (source-of-truth for busyness)
    const { data: busy, error: busyErr } = await admin.rpc(
      "get_external_instructor_busy_blocks",
      {
        p_partner_key: body.partner_key,
        p_instructor_id: body.instructor_id,
        p_from: startDate.toISOString(),
        p_to: endDate.toISOString(),
      },
    );
    if (busyErr) throw busyErr;
    if (Array.isArray(busy) && busy.length > 0) {
      return json({ error: "Slot no longer available", code: "SLOT_TAKEN" }, 409);
    }

    // Upsert pupil by (instructor_id, email)
    const email = String(body.pupil.email).trim().toLowerCase();
    const { data: existingPupil } = await admin
      .from("pupils")
      .select("id")
      .eq("instructor_id", body.instructor_id)
      .ilike("email", email)
      .is("deleted_at", null)
      .maybeSingle();

    let pupilId: string;
    if (existingPupil) {
      pupilId = existingPupil.id;
    } else {
      const { data: newPupil, error: pupilErr } = await admin
        .from("pupils")
        .insert({
          instructor_id: body.instructor_id,
          name: body.pupil.name,
          email,
          phone: body.pupil.phone ?? null,
          postcode: body.pupil.postcode ?? null,
        })
        .select("id")
        .single();
      if (pupilErr) throw pupilErr;
      pupilId = newPupil.id;
    }

    // Geocode pickup
    const coords = await geocodePostcode(body.pickup_postcode || body.pupil.postcode);

    // Compute price
    const hourly = Number(instructor.hourly_rate || 0);
    const amountDue = +(hourly * (body.duration_minutes / 60)).toFixed(2);

    // Insert lesson — date+time strings (London) split from ISO
    const lessonDate = startDate.toISOString().slice(0, 10);
    const startTime = startDate.toISOString().slice(11, 19);

    const { data: lesson, error: lessonErr } = await admin
      .from("scheduled_lessons")
      .insert({
        instructor_id: body.instructor_id,
        pupil_id: pupilId,
        lesson_date: lessonDate,
        start_time: startTime,
        duration_minutes: body.duration_minutes,
        lesson_type: body.lesson_type || "standard",
        pickup_location: body.pickup_location ?? null,
        pickup_postcode: body.pickup_postcode || body.pupil.postcode || null,
        pickup_lat: coords?.lat ?? null,
        pickup_lng: coords?.lng ?? null,
        status: "scheduled",
        booking_status: "confirmed",
        payment_status: "pending",
        amount_due: amountDue,
        price_per_hour: hourly,
        notes: body.notes ?? null,
        booking_method: `partner:${body.partner_key}`,
        awaiting_initial_payment: true,
      })
      .select("id")
      .single();
    if (lessonErr) throw lessonErr;

    return json({
      ok: true,
      booking_id: lesson.id,
      pupil_id: pupilId,
      instructor_id: body.instructor_id,
      amount_due: amountDue,
      currency: "GBP",
    });
  } catch (e) {
    console.error("[public-create-booking] error:", e);
    return json({ error: (e as Error)?.message || "Internal error" }, 500);
  }
});
