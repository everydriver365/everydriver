import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const Body = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approve", "decline", "counter"]),
  counter_start: z.string().datetime().optional(),
  counter_duration_minutes: z.number().int().min(30).max(480).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: instructorRow } = await admin
      .from("instructors").select("id").eq("auth_user_id", userRes.user.id).maybeSingle();
    if (!instructorRow) return json({ error: "No instructor profile" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { request_id, action, counter_start, counter_duration_minutes } = parsed.data;

    const { data: reqRow } = await admin
      .from("ai_booking_requests")
      .select("*")
      .eq("id", request_id)
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();
    if (!reqRow) return json({ error: "Booking request not found" }, 404);
    if (reqRow.status !== "pending") return json({ error: `Already ${reqRow.status}` }, 409);

    if (action === "decline") {
      await admin.from("ai_booking_requests").update({
        status: "declined", decided_at: new Date().toISOString(),
      }).eq("id", request_id);
      return json({ success: true, status: "declined" });
    }

    if (action === "counter") {
      if (!counter_start) return json({ error: "counter_start required" }, 400);
      await admin.from("ai_booking_requests").update({
        status: "countered",
        decided_at: new Date().toISOString(),
        requested_start: counter_start,
        duration_minutes: counter_duration_minutes ?? reqRow.duration_minutes,
      }).eq("id", request_id);
      return json({ success: true, status: "countered" });
    }

    // approve → create scheduled lesson
    const start = new Date(reqRow.requested_start);
    const lessonDate = start.toISOString().slice(0, 10);
    const startTime = start.toISOString().slice(11, 19);

    const { data: lesson, error: lessonErr } = await admin
      .from("scheduled_lessons")
      .insert({
        instructor_id: instructorRow.id,
        pupil_id: reqRow.pupil_id,
        lesson_date: lessonDate,
        start_time: startTime,
        duration_minutes: reqRow.duration_minutes,
        status: "scheduled",
        notes: reqRow.notes ?? `Booked by AI via ${reqRow.source_channel}`,
      })
      .select("id")
      .single();

    if (lessonErr) return json({ error: lessonErr.message }, 400);

    await admin.from("ai_booking_requests").update({
      status: "approved",
      decided_at: new Date().toISOString(),
      resulting_lesson_id: lesson.id,
    }).eq("id", request_id);

    return json({ success: true, status: "approved", lesson_id: lesson.id });
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
