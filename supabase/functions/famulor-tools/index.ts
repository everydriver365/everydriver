// Tool endpoint that Famulor agents call mid-conversation.
// Authenticated via FAMULOR_WEBHOOK_SECRET in `x-famulor-secret` header.
// Every payload must include instructor_id; everything is scoped to that instructor.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-famulor-secret",
};

const Tool = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("get_available_slots"),
    instructor_id: z.string().uuid(),
    date_from: z.string(),
    date_to: z.string(),
  }),
  z.object({
    tool: z.literal("get_pupil_by_phone"),
    instructor_id: z.string().uuid(),
    phone: z.string().min(5),
  }),
  z.object({
    tool: z.literal("get_prices"),
    instructor_id: z.string().uuid(),
  }),
  z.object({
    tool: z.literal("create_booking_request"),
    instructor_id: z.string().uuid(),
    source_channel: z.enum(["phone_in", "phone_out", "whatsapp", "webchat"]),
    requested_start: z.string().datetime(),
    duration_minutes: z.number().int().min(30).max(480),
    pupil_id: z.string().uuid().optional(),
    contact_name: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email().optional(),
    notes: z.string().optional(),
    source_call_log_id: z.string().uuid().optional(),
  }),
  z.object({
    tool: z.literal("verify_parent"),
    instructor_id: z.string().uuid(),
    phone: z.string().optional(),
    pupil_name: z.string().optional(),
    date_of_birth: z.string().optional(), // YYYY-MM-DD
  }),
  z.object({
    tool: z.literal("get_pupil_lessons"),
    instructor_id: z.string().uuid(),
    pupil_id: z.string().uuid(),
  }),
  z.object({
    tool: z.literal("request_reschedule"),
    instructor_id: z.string().uuid(),
    source_channel: z.enum(["phone_in", "phone_out", "whatsapp", "webchat"]),
    pupil_id: z.string().uuid(),
    lesson_id: z.string().uuid(),
    requested_start: z.string().datetime(),
    requested_duration_minutes: z.number().int().min(30).max(480).optional(),
    contact_name: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email().optional(),
    notes: z.string().optional(),
  }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = Deno.env.get("FAMULOR_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-famulor-secret") !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const parsed = Tool.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const p = parsed.data;

    if (p.tool === "get_available_slots") {
      const { data: lessons } = await admin
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", p.instructor_id)
        .gte("lesson_date", p.date_from)
        .lte("lesson_date", p.date_to)
        .neq("status", "cancelled")
        .is("deleted_at", null);
      return json({ busy: lessons ?? [] });
    }

    if (p.tool === "get_pupil_by_phone") {
      const { data } = await admin
        .from("pupils")
        .select("id, name, phone, email, account_balance")
        .eq("instructor_id", p.instructor_id)
        .eq("phone", p.phone)
        .is("deleted_at", null)
        .maybeSingle();
      return json({ pupil: data ?? null });
    }

    if (p.tool === "get_prices") {
      const { data } = await admin
        .from("instructors")
        .select("hourly_rate")
        .eq("id", p.instructor_id)
        .maybeSingle();
      return json({ pricing: { ...(data ?? {}), currency: "GBP" } });
    }

    if (p.tool === "create_booking_request") {
      const { data, error } = await admin
        .from("ai_booking_requests")
        .insert({
          instructor_id: p.instructor_id,
          source_channel: p.source_channel,
          source_call_log_id: p.source_call_log_id ?? null,
          pupil_id: p.pupil_id ?? null,
          contact_name: p.contact_name ?? null,
          contact_phone: p.contact_phone ?? null,
          contact_email: p.contact_email ?? null,
          requested_start: p.requested_start,
          duration_minutes: p.duration_minutes,
          notes: p.notes ?? null,
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 400);

      // Fire-and-forget in-app notification fan-out.
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-ai-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          kind: "booking_created",
          instructor_id: p.instructor_id,
          pupil_id: p.pupil_id ?? null,
          request_id: data.id,
          contact_name: p.contact_name ?? null,
          contact_phone: p.contact_phone ?? null,
          source_channel: p.source_channel,
          requested_start: p.requested_start,
        }),
      }).catch((e) => console.error("[famulor-tools] notify failed", e));

      return json({ request_id: data.id });
    }

    if (p.tool === "verify_parent") {
      let q = admin
        .from("pupils")
        .select("id, name, phone, email, date_of_birth")
        .eq("instructor_id", p.instructor_id)
        .is("deleted_at", null);

      if (p.phone) {
        q = q.eq("phone", p.phone);
      } else if (p.pupil_name && p.date_of_birth) {
        q = q.ilike("name", p.pupil_name).eq("date_of_birth", p.date_of_birth);
      } else {
        return json({ error: "Provide phone, or pupil_name + date_of_birth" }, 400);
      }

      const { data } = await q.maybeSingle();
      if (!data) return json({ verified: false, pupil: null });
      return json({ verified: true, pupil: { id: data.id, name: data.name } });
    }

    if (p.tool === "get_pupil_lessons") {
      const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { data } = await admin
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, status")
        .eq("instructor_id", p.instructor_id)
        .eq("pupil_id", p.pupil_id)
        .neq("status", "cancelled")
        .is("deleted_at", null)
        .order("lesson_date", { ascending: true })
        .limit(20);

      const eligible = (data ?? []).filter((l: any) => {
        const start = new Date(`${l.lesson_date}T${l.start_time}`);
        return start.toISOString() > cutoff;
      });
      return json({ lessons: eligible });
    }

    if (p.tool === "request_reschedule") {
      const { data: lesson } = await admin
        .from("scheduled_lessons")
        .select("id, instructor_id, pupil_id, lesson_date, start_time, duration_minutes, status, deleted_at")
        .eq("id", p.lesson_id)
        .maybeSingle();

      if (!lesson || lesson.instructor_id !== p.instructor_id || lesson.pupil_id !== p.pupil_id) {
        return json({ error: "Lesson not found for this pupil" }, 404);
      }
      if (lesson.status === "cancelled" || lesson.deleted_at) {
        return json({ error: "Lesson is cancelled and cannot be rescheduled" }, 400);
      }

      const originalStart = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
      const now = new Date();
      const hoursToOriginal = (originalStart.getTime() - now.getTime()) / 36e5;
      if (hoursToOriginal < 2) {
        return json({ error: "Lessons within 2 hours cannot be rescheduled via AI chat" }, 400);
      }

      const newStart = new Date(p.requested_start);
      const hoursToNew = (newStart.getTime() - now.getTime()) / 36e5;
      if (hoursToNew < 2) {
        return json({ error: "New time must be at least 2 hours from now" }, 400);
      }

      const newDuration = p.requested_duration_minutes ?? lesson.duration_minutes;
      const dayStr = newStart.toISOString().slice(0, 10);
      const newStartMin = newStart.getUTCHours() * 60 + newStart.getUTCMinutes();
      const newEndMin = newStartMin + newDuration;

      const { data: sameDay } = await admin
        .from("scheduled_lessons")
        .select("id, start_time, duration_minutes")
        .eq("instructor_id", p.instructor_id)
        .eq("lesson_date", dayStr)
        .neq("status", "cancelled")
        .is("deleted_at", null);

      const hasClash = (sameDay ?? []).some((l: any) => {
        if (l.id === p.lesson_id) return false;
        const [h, m] = String(l.start_time).split(":").map(Number);
        const s = h * 60 + m;
        const e = s + l.duration_minutes;
        return s < newEndMin && e > newStartMin;
      });

      const willAutoApprove = hoursToNew >= 24 && !hasClash;

      const { data: requestRow, error: insertErr } = await admin
        .from("ai_reschedule_requests")
        .insert({
          instructor_id: p.instructor_id,
          lesson_id: p.lesson_id,
          pupil_id: p.pupil_id,
          source_channel: p.source_channel,
          contact_name: p.contact_name ?? null,
          contact_phone: p.contact_phone ?? null,
          contact_email: p.contact_email ?? null,
          original_start: originalStart.toISOString(),
          original_duration_minutes: lesson.duration_minutes,
          requested_start: newStart.toISOString(),
          requested_duration_minutes: newDuration,
          notes: p.notes ?? null,
          status: willAutoApprove ? "auto_approved" : "pending",
          auto_approved: willAutoApprove,
          decided_at: willAutoApprove ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (insertErr) return json({ error: insertErr.message }, 400);

      if (willAutoApprove) {
        const { error: updErr } = await admin
          .from("scheduled_lessons")
          .update({
            lesson_date: dayStr,
            start_time: newStart.toISOString().slice(11, 19),
            duration_minutes: newDuration,
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.lesson_id);

        if (updErr) {
          await admin.from("ai_reschedule_requests").update({
            status: "pending", auto_approved: false, decided_at: null,
            notes: (p.notes ?? "") + ` [auto-approve failed: ${updErr.message}]`,
          }).eq("id", requestRow.id);
          return json({
            request_id: requestRow.id,
            status: "pending",
            message: "Sent to instructor for approval (auto-approve failed).",
          });
        }
      }

      // Fire-and-forget in-app notification fan-out.
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-ai-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          kind: willAutoApprove ? "reschedule_auto_approved" : "reschedule_created",
          instructor_id: p.instructor_id,
          pupil_id: p.pupil_id,
          request_id: requestRow.id,
          lesson_id: p.lesson_id,
          contact_name: p.contact_name ?? null,
          contact_phone: p.contact_phone ?? null,
          source_channel: p.source_channel,
          requested_start: newStart.toISOString(),
          original_start: originalStart.toISOString(),
        }),
      }).catch((e) => console.error("[famulor-tools] notify failed", e));

      return json({
        request_id: requestRow.id,
        status: willAutoApprove ? "auto_approved" : "pending",
        message: willAutoApprove
          ? "Lesson rescheduled. A confirmation will be sent shortly."
          : hasClash
            ? "Slot conflicts with another lesson — sent to instructor for approval."
            : "Less than 24h notice — sent to instructor for approval.",
      });
    }

    return json({ error: "Unknown tool" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
