/**
 * slot-offer-broadcast
 * --------------------------------------------------------------
 * Creates a slot_offers row (status='open') and fans it out to the
 * instructor's active pupils via slot_offer_recipients. Sends a
 * push notification per recipient via notify-pupil.
 *
 * POST body:
 * {
 *   instructor_id: uuid,
 *   slot_date: 'YYYY-MM-DD',
 *   start_time: 'HH:MM:SS',
 *   end_time:   'HH:MM:SS',
 *   duration_mins: number,
 *   location_hint?: string,
 *   target: 'all_active' | string[],   // 'all_active' or list of pupil ids
 *   expires_in_hours?: number          // default 4
 * }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RECIPIENTS = 200;

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
    const {
      instructor_id,
      slot_date,
      start_time,
      end_time,
      duration_mins,
      location_hint,
      target,
      expires_in_hours = 4,
    } = body ?? {};

    if (!instructor_id || !slot_date || !start_time || !end_time || !duration_mins || !target) {
      return new Response(
        JSON.stringify({ error: "instructor_id, slot_date, start_time, end_time, duration_mins, target are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify the caller IS this instructor
    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, app_slug")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (!instructor || instructor.id !== instructor_id) {
      return new Response(JSON.stringify({ error: "Not your instructor profile" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve recipients
    let pupilIds: string[] = [];
    if (target === "all_active") {
      const { data: rows } = await admin
        .from("pupils")
        .select("id")
        .eq("instructor_id", instructor_id)
        .eq("status", "active")
        .is("deleted_at", null);
      pupilIds = (rows ?? []).map((r) => r.id);
    } else if (Array.isArray(target)) {
      pupilIds = target.filter((x): x is string => typeof x === "string");
    } else {
      return new Response(JSON.stringify({ error: "target must be 'all_active' or string[]" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pupilIds.length === 0) {
      return new Response(JSON.stringify({ error: "No eligible pupils to notify" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let truncated = false;
    if (pupilIds.length > MAX_RECIPIENTS) {
      console.warn(`[slot-offer-broadcast] Recipient list ${pupilIds.length} exceeds cap ${MAX_RECIPIENTS}, truncating`);
      pupilIds = pupilIds.slice(0, MAX_RECIPIENTS);
      truncated = true;
    }

    // Create the offer
    const expiresAt = new Date(Date.now() + Number(expires_in_hours) * 3_600_000).toISOString();
    const { data: offer, error: offerErr } = await admin
      .from("slot_offers")
      .insert({
        instructor_id,
        lesson_date: slot_date,
        start_time,
        end_time,
        duration_mins,
        status: "open",
        instructor_approved: true,
        instructor_approved_at: new Date().toISOString(),
        expires_at: expiresAt,
        pupil_response: "pending",
      })
      .select("id")
      .single();

    if (offerErr || !offer) {
      throw new Error(offerErr?.message ?? "Failed to create slot offer");
    }

    // Bulk insert recipients
    const recipientRows = pupilIds.map((pid) => ({
      slot_offer_id: offer.id,
      pupil_id: pid,
      instructor_id,
    }));

    const { error: recErr } = await admin
      .from("slot_offer_recipients")
      .insert(recipientRows);

    if (recErr) {
      console.error("[slot-offer-broadcast] recipients insert failed", recErr);
      throw new Error(recErr.message);
    }

    // Fire push notifications (best-effort, parallel)
    const formatTime = (t: string) => {
      const [h, m] = t.split(":");
      const hh = parseInt(h, 10);
      const ampm = hh >= 12 ? "pm" : "am";
      const h12 = hh % 12 || 12;
      return `${h12}:${m}${ampm}`;
    };
    const dateLabel = new Date(slot_date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
    const title = "A lesson slot is available — grab it now";
    const bodyText = `${dateLabel} at ${formatTime(start_time)} with ${instructor.name}. First to claim gets it.`;

    await Promise.all(pupilIds.map(async (pid) => {
      try {
        await admin.functions.invoke("notify-pupil", {
          body: {
            pupilId: pid,
            type: "slot_offer",
            title,
            body: bodyText,
            data: {
              offer_id: offer.id,
              date: slot_date,
              start_time,
              end_time,
              instructor_name: instructor.name,
              location_hint: location_hint ?? null,
              url: instructor.app_slug ? `/p/${instructor.app_slug}?offer_id=${offer.id}` : undefined,
            },
          },
        });
      } catch (e) {
        console.error("[slot-offer-broadcast] notify-pupil failed for", pid, e);
      }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        offer_id: offer.id,
        recipient_count: pupilIds.length,
        truncated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[slot-offer-broadcast]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
