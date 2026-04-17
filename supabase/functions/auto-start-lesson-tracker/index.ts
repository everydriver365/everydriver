// Auto-start a telematics tracking session for any lesson whose start_time
// just elapsed, when the instructor has the `auto_start_tracker` setting on
// and no telematics session has been started for that lesson yet.
//
// Designed to be invoked once per minute by pg_cron.

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
    const windowStart = new Date(now.getTime() - 2 * 60 * 1000).toISOString(); // 2 min ago
    const today = now.toISOString().slice(0, 10);

    // Find candidate lessons: started in the last 2 minutes, instructor opted in,
    // pupil attached, and not already linked to a telematics session.
    const { data: lessons, error: lessonsErr } = await supabase
      .from("scheduled_lessons")
      .select(`
        id,
        instructor_id,
        pupil_id,
        lesson_date,
        start_time,
        status,
        instructors:instructor_id ( auto_start_tracker )
      `)
      .eq("lesson_date", today)
      .in("status", ["scheduled", "confirmed", "arrived", "en_route"])
      .not("pupil_id", "is", null);

    if (lessonsErr) throw lessonsErr;

    const startedSessions: Array<{ lesson_id: string; session_id: string }> = [];

    for (const lesson of lessons ?? []) {
      const optedIn = (lesson as any).instructors?.auto_start_tracker === true;
      if (!optedIn) continue;

      // Build the lesson's actual start moment
      const lessonStartIso = `${lesson.lesson_date}T${lesson.start_time}`;
      const lessonStart = new Date(lessonStartIso);
      if (isNaN(lessonStart.getTime())) continue;

      // Only fire if start_time is in the small window: between 2 min ago and now
      if (lessonStart > now) continue;
      if (lessonStart.toISOString() < windowStart) continue;

      // Skip if a telematics session already exists for this lesson today
      // (we match on instructor + pupil + started_at >= lessonStart - 5 min)
      const skew = new Date(lessonStart.getTime() - 5 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", lesson.instructor_id)
        .eq("pupil_id", lesson.pupil_id)
        .gte("started_at", skew)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { data: session, error: insertErr } = await supabase
        .from("lesson_telematics")
        .insert({
          instructor_id: lesson.instructor_id,
          pupil_id: lesson.pupil_id,
          started_at: now.toISOString(),
          total_distance_km: 0,
          manually_started: false,
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error(`Failed to start session for lesson ${lesson.id}:`, insertErr.message);
        continue;
      }

      // Attach the session to the instructor's primary active GPS device, if any.
      const { data: device } = await supabase
        .from("gps_devices")
        .select("id")
        .eq("instructor_id", lesson.instructor_id)
        .eq("is_active", true)
        .is("current_session_id", null)
        .limit(1)
        .maybeSingle();

      if (device?.id) {
        await supabase
          .from("gps_devices")
          .update({
            current_session_id: session.id,
            current_pupil_id: lesson.pupil_id,
          })
          .eq("id", device.id);
      }

      startedSessions.push({ lesson_id: lesson.id, session_id: session.id });
    }

    return new Response(
      JSON.stringify({ ok: true, started: startedSessions.length, sessions: startedSessions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("auto-start-lesson-tracker error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
