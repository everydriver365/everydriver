// Auto-stop telematics tracking sessions whose linked lesson has just ended.
// Runs once per minute via pg_cron. When a session ends, the auto_log_mileage
// DB trigger writes a per-pupil mileage_logs row (business mileage).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Find open tracking sessions
    const { data: sessions, error: sessErr } = await supabase
      .from("lesson_telematics")
      .select("id, instructor_id, pupil_id, started_at")
      .is("ended_at", null)
      .not("pupil_id", "is", null);

    if (sessErr) throw sessErr;

    const stopped: Array<{ session_id: string; lesson_id: string }> = [];

    for (const session of sessions ?? []) {
      // Find the lesson that this session belongs to: today, same instructor+pupil,
      // whose end_time has passed by at least 1 minute.
      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, end_time")
        .eq("instructor_id", session.instructor_id)
        .eq("pupil_id", session.pupil_id)
        .eq("lesson_date", today)
        .order("end_time", { ascending: false });

      if (!lessons || lessons.length === 0) continue;

      // Find the most recent lesson whose end_time has elapsed
      const ended = lessons.find((l: any) => {
        const endIso = `${l.lesson_date}T${l.end_time}`;
        const endDate = new Date(endIso);
        if (isNaN(endDate.getTime())) return false;
        return endDate.getTime() <= now.getTime() - 60 * 1000;
      });

      if (!ended) continue;

      // End the session — the auto_log_mileage trigger will log mileage.
      const { error: updErr } = await supabase
        .from("lesson_telematics")
        .update({ ended_at: now.toISOString() })
        .eq("id", session.id);

      if (updErr) {
        console.error(`Failed to stop session ${session.id}:`, updErr.message);
        continue;
      }

      // Detach from any GPS device that's still pointing at this session
      await supabase
        .from("gps_devices")
        .update({
          current_session_id: null,
          current_pupil_id: null,
          session_start_ecu_odometer_km: null,
        })
        .eq("current_session_id", session.id);

      stopped.push({ session_id: session.id, lesson_id: ended.id });
    }

    return new Response(
      JSON.stringify({ ok: true, stopped: stopped.length, sessions: stopped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("auto-stop-lesson-tracker error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
