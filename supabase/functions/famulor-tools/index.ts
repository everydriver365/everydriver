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
      return json({ request_id: data.id });
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
