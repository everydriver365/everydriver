// Daily dormant pupil win-back. Finds pupils with no lesson in
// `dormant_days_threshold` days and triggers AI win-back calls — capped to
// `daily_call_cap` per instructor per day.

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
      .eq("dormant_winback_enabled", true);

    const summary: any[] = [];
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (const s of settingsRows ?? []) {
      if (!s.outbound_agent_id) continue;

      const { count: todayCount } = await admin
        .from("famulor_call_logs")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", s.instructor_id)
        .gte("created_at", todayMidnight.toISOString());
      let remaining = (s.daily_call_cap ?? 20) - (todayCount ?? 0);
      if (remaining <= 0) continue;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (s.dormant_days_threshold ?? 60));
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      // Pupils with phone, active, last lesson before cutoff (or no lessons)
      const { data: pupils } = await admin
        .from("pupils")
        .select("id, name, phone, course_status")
        .eq("instructor_id", s.instructor_id)
        .is("deleted_at", null)
        .not("phone", "is", null)
        .neq("course_status", "completed")
        .limit(100);

      for (const p of pupils ?? []) {
        if (remaining <= 0) break;

        // Last lesson date
        const { data: lastLesson } = await admin
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("pupil_id", p.id)
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastDate = lastLesson?.lesson_date as string | undefined;
        if (lastDate && lastDate > cutoffStr) continue;

        // Don't re-call within last 30 days
        const thirtyAgo = new Date();
        thirtyAgo.setDate(thirtyAgo.getDate() - 30);
        const { data: recent } = await admin
          .from("famulor_call_logs")
          .select("id")
          .eq("pupil_id", p.id)
          .eq("purpose", "win_back")
          .gte("created_at", thirtyAgo.toISOString())
          .limit(1)
          .maybeSingle();
        if (recent) continue;

        const { data: instr } = await admin
          .from("instructors")
          .select("name")
          .eq("id", s.instructor_id)
          .maybeSingle();

        const { data: logRow } = await admin
          .from("famulor_call_logs")
          .insert({
            instructor_id: s.instructor_id,
            pupil_id: p.id,
            direction: "outbound",
            purpose: "win_back",
            phone_number: p.phone,
            status: "queued",
            metadata: { pupil_name: p.name },
          })
          .select()
          .single();

        const fRes = await fetch(`${FAMULOR_BASE}/calls`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${FAMULOR_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: s.outbound_agent_id,
            to: p.phone,
            voice_id: s.voice_id ?? undefined,
            dynamic_variables: {
              instructor_name: instr?.name ?? "your instructor",
              pupil_name: p.name ?? "",
              purpose: "win_back",
              log_id: logRow!.id,
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

        if (fRes.ok) remaining -= 1;
        summary.push({ pupil_id: p.id, ok: fRes.ok });
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("famulor-cron-dormant error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
