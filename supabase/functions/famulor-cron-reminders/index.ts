// Scheduled hourly via pg_cron. Finds lessons starting in `reminder_hours_before`
// (±30 min window) for instructors with reminders enabled, and triggers an
// AI reminder call via Famulor. Public endpoint (verify_jwt=false) — only
// pg_cron should call it; we still gate by service-role logic.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
const FAMULOR_BASE = "https://api.famulor.de/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) throw new Error("FAMULOR_API_KEY not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: settingsRows } = await admin
      .from("famulor_settings")
      .select("*")
      .eq("enabled", true)
      .eq("reminders_enabled", true);

    const triggered: any[] = [];
    const now = new Date();

    for (const s of settingsRows ?? []) {
      if (!s.outbound_agent_id) continue;
      const hoursBefore = s.reminder_hours_before ?? 24;
      const targetStart = new Date(now.getTime() + (hoursBefore * 60 - 30) * 60_000);
      const targetEnd = new Date(now.getTime() + (hoursBefore * 60 + 30) * 60_000);

      const dateStr = targetStart.toISOString().slice(0, 10);
      const dateStrEnd = targetEnd.toISOString().slice(0, 10);

      // Pull lessons in the window
      const { data: lessons } = await admin
        .from("scheduled_lessons")
        .select("id, pupil_id, lesson_date, start_time, duration_minutes, pickup_address")
        .eq("instructor_id", s.instructor_id)
        .in("lesson_date", Array.from(new Set([dateStr, dateStrEnd])))
        .neq("status", "cancelled")
        .is("deleted_at", null);

      for (const l of lessons ?? []) {
        const dt = new Date(`${l.lesson_date}T${l.start_time}`);
        if (dt < targetStart || dt > targetEnd) continue;

        // Skip if already reminded
        const { data: existing } = await admin
          .from("famulor_call_logs")
          .select("id")
          .eq("instructor_id", s.instructor_id)
          .eq("purpose", "reminder")
          .contains("metadata", { lesson_id: l.id })
          .maybeSingle();
        if (existing) continue;

        const { data: pupil } = await admin
          .from("pupils")
          .select("id, name, phone")
          .eq("id", l.pupil_id)
          .maybeSingle();
        if (!pupil?.phone) continue;

        const { data: instr } = await admin
          .from("instructors")
          .select("name")
          .eq("id", s.instructor_id)
          .maybeSingle();

        const { data: logRow } = await admin
          .from("famulor_call_logs")
          .insert({
            instructor_id: s.instructor_id,
            pupil_id: pupil.id,
            direction: "outbound",
            purpose: "reminder",
            phone_number: pupil.phone,
            status: "queued",
            metadata: { lesson_id: l.id, pupil_name: pupil.name },
          })
          .select()
          .single();

        const fRes = await fetch(`${FAMULOR_BASE}/calls`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${FAMULOR_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: s.outbound_agent_id,
            to: pupil.phone,
            voice_id: s.voice_id ?? undefined,
            dynamic_variables: {
              instructor_name: instr?.name ?? "your instructor",
              pupil_name: pupil.name ?? "",
              purpose: "reminder",
              log_id: logRow!.id,
              lesson_date: l.lesson_date,
              lesson_time: l.start_time,
              lesson_duration: String(l.duration_minutes ?? ""),
              pickup_address: l.pickup_address ?? "",
            },
            metadata: { log_id: logRow!.id, instructor_id: s.instructor_id },
          }),
        });
        const fJson = await fRes.json().catch(() => ({}));
        await admin
          .from("famulor_call_logs")
          .update({
            status: fRes.ok ? "in_progress" : "failed",
            famulor_call_id: fJson?.id ?? fJson?.call_id ?? null,
            summary: fRes.ok ? null : `Trigger failed: ${JSON.stringify(fJson).slice(0, 300)}`,
          })
          .eq("id", logRow!.id);
        triggered.push({ lesson_id: l.id, ok: fRes.ok });
      }
    }

    return new Response(JSON.stringify({ ok: true, triggered }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("famulor-cron-reminders error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
