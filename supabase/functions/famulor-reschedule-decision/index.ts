// Instructor approves/declines a parent reschedule request that was routed
// for manual approval (clash or <24h notice).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const Body = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approve", "decline"]),
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
    const { request_id, action } = parsed.data;

    const { data: reqRow } = await admin
      .from("ai_reschedule_requests")
      .select("*")
      .eq("id", request_id)
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();
    if (!reqRow) return json({ error: "Reschedule request not found" }, 404);
    if (reqRow.status !== "pending") return json({ error: `Already ${reqRow.status}` }, 409);

    if (action === "decline") {
      await admin.from("ai_reschedule_requests").update({
        status: "declined", decided_at: new Date().toISOString(),
      }).eq("id", request_id);
      return json({ success: true, status: "declined" });
    }

    // approve → update the lesson
    const newStart = new Date(reqRow.requested_start);
    const lessonDate = newStart.toISOString().slice(0, 10);
    const startTime = newStart.toISOString().slice(11, 19);

    const { error: lessonErr } = await admin
      .from("scheduled_lessons")
      .update({
        lesson_date: lessonDate,
        start_time: startTime,
        duration_minutes: reqRow.requested_duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reqRow.lesson_id);

    if (lessonErr) return json({ error: lessonErr.message }, 400);

    await admin.from("ai_reschedule_requests").update({
      status: "approved",
      decided_at: new Date().toISOString(),
    }).eq("id", request_id);

    return json({ success: true, status: "approved", lesson_id: reqRow.lesson_id });
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
