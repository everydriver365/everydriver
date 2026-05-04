// In-app notification fan-out for AI booking & reschedule events.
// Email is intentionally NOT sent here yet (domain pending DNS verification).
//
// Fans out to:
//   - instructor_notifications (instructor bell)
//   - admin_alerts             (admin bell)
//   - parent_messages          (parent in-app channel, decisions only)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const Body = z.object({
  kind: z.enum([
    "booking_created",
    "booking_approved",
    "booking_declined",
    "reschedule_created",
    "reschedule_auto_approved",
    "reschedule_approved",
    "reschedule_declined",
  ]),
  instructor_id: z.string().uuid(),
  pupil_id: z.string().uuid().nullable().optional(),
  request_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  source_channel: z.string().optional(),
  requested_start: z.string().optional(),
  original_start: z.string().nullable().optional(),
});

type Payload = z.infer<typeof Body>;

const fmt = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

function buildCopy(p: Payload) {
  const who = p.contact_name ?? "A learner";
  const when = fmt(p.requested_start);
  const from = fmt(p.original_start);
  const via = p.source_channel ? ` via ${String(p.source_channel).replace("_", " ")}` : "";

  switch (p.kind) {
    case "booking_created":
      return {
        title: "New AI booking request",
        message: `${who} requested a lesson${when ? ` on ${when}` : ""}${via}.`,
        type: "ai_booking",
        action_url: "/instructor/famulor",
        parent: null as string | null,
      };
    case "booking_approved":
      return {
        title: "AI booking approved",
        message: `Lesson with ${who}${when ? ` on ${when}` : ""} is confirmed.`,
        type: "ai_booking",
        action_url: "/instructor/lessons",
        parent: `Your lesson${when ? ` on ${when}` : ""} is confirmed. See you then!`,
      };
    case "booking_declined":
      return {
        title: "AI booking declined",
        message: `Request from ${who}${when ? ` for ${when}` : ""} was declined.`,
        type: "ai_booking",
        action_url: "/instructor/famulor",
        parent: `Sorry — your requested lesson${when ? ` on ${when}` : ""} couldn't be confirmed. Please reply to suggest another time.`,
      };
    case "reschedule_created":
      return {
        title: "Reschedule request from AI",
        message: `${who} asked to move ${from || "their lesson"} → ${when}.`,
        type: "ai_reschedule",
        action_url: "/instructor/famulor",
        parent: null,
      };
    case "reschedule_auto_approved":
      return {
        title: "Lesson auto-rescheduled",
        message: `${who}'s lesson moved ${from ? `from ${from} ` : ""}to ${when}.`,
        type: "ai_reschedule",
        action_url: "/instructor/lessons",
        parent: `Your lesson has been moved to ${when}. See you then!`,
      };
    case "reschedule_approved":
      return {
        title: "Reschedule approved",
        message: `${who}'s lesson moved ${from ? `from ${from} ` : ""}to ${when}.`,
        type: "ai_reschedule",
        action_url: "/instructor/lessons",
        parent: `Your reschedule is confirmed: ${when}.`,
      };
    case "reschedule_declined":
      return {
        title: "Reschedule declined",
        message: `Reschedule request from ${who}${when ? ` to ${when}` : ""} was declined.`,
        type: "ai_reschedule",
        action_url: "/instructor/famulor",
        parent: `Sorry — your reschedule request${when ? ` to ${when}` : ""} couldn't be confirmed. Please reply to suggest another time.`,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const p = parsed.data;
    const copy = buildCopy(p);

    const metadata = {
      request_id: p.request_id ?? null,
      lesson_id: p.lesson_id ?? null,
      pupil_id: p.pupil_id ?? null,
      source_channel: p.source_channel ?? null,
      requested_start: p.requested_start ?? null,
      original_start: p.original_start ?? null,
      contact_name: p.contact_name ?? null,
      contact_phone: p.contact_phone ?? null,
    };

    // 1. Instructor bell
    await admin.from("instructor_notifications").insert({
      instructor_id: p.instructor_id,
      title: copy.title,
      message: copy.message,
      type: copy.type,
      action_url: copy.action_url,
      metadata,
    }).then(({ error }) => {
      if (error) console.error("[notify-ai-event] instructor insert", error.message);
    });

    // 2. Admin bell
    await admin.from("admin_alerts").insert({
      alert_type: copy.type,
      instructor_id: p.instructor_id,
      message: `${copy.title}: ${copy.message}`,
      metadata,
    }).then(({ error }) => {
      if (error) console.error("[notify-ai-event] admin insert", error.message);
    });

    // 3. Parent in-app channel (only on decisions, only if pupil known)
    if (copy.parent && p.pupil_id) {
      try {
        const { data: convo } = await admin
          .from("parent_conversations")
          .select("id")
          .eq("instructor_id", p.instructor_id)
          .eq("pupil_id", p.pupil_id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (convo?.id) {
          await admin.from("parent_messages").insert({
            conversation_id: convo.id,
            sender_type: "system",
            content: copy.parent,
          });
        }
      } catch (e) {
        console.error("[notify-ai-event] parent insert", (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-ai-event] fatal", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
