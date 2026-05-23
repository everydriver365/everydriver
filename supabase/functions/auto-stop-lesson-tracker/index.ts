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
      .select("id, instructor_id, pupil_id, lesson_id, started_at, total_distance_km")
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

      const endedAtIso = now.toISOString();

      // End the session — the auto_log_mileage trigger will log mileage.
      const { error: updErr } = await supabase
        .from("lesson_telematics")
        .update({ ended_at: endedAtIso })
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

      // --- Stats backfill + route capture (best-effort; never fail the stop) ---
      try {
        const { data: points } = await supabase
          .from("telematics_gps_points")
          .select("speed_kmh, latitude, longitude, recorded_at")
          .eq("telematics_id", session.id)
          .order("recorded_at", { ascending: true });

        const speeds = (points ?? [])
          .map((p: any) => p.speed_kmh ?? 0)
          .filter((s: number) => s > 0);
        const avgSpeed = speeds.length
          ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length
          : null;
        const maxSpeed = speeds.length ? Math.max(...speeds) : null;

        if (avgSpeed !== null || maxSpeed !== null) {
          const { error: statsErr } = await supabase
            .from("lesson_telematics")
            .update({ avg_speed_kmh: avgSpeed, max_speed_kmh: maxSpeed })
            .eq("id", session.id);
          if (statsErr) console.error(`Stats update failed for ${session.id}:`, statsErr.message);
        }

        if (!points || points.length < 2) {
          // Nothing to draw — skip silently
        } else if (!session.lesson_id) {
          console.warn(
            `Session ${session.id} has no lesson_id — skipping lesson_routes capture`,
          );
        } else {
          // Idempotent: skip if a row already exists for this session
          const { data: existing } = await supabase
            .from("lesson_routes")
            .select("id")
            .eq("telematics_id", session.id)
            .maybeSingle();

          if (!existing) {
            const maxPoints = 200;
            const step = Math.max(1, Math.floor(points.length / maxPoints));
            const sampled = points.filter((_: any, i: number) => i % step === 0);
            const coordinates = sampled.map((p: any) => ({
              lat: p.latitude,
              lng: p.longitude,
              speed: p.speed_kmh,
              timestamp: p.recorded_at,
            }));

            const first = new Date(points[0].recorded_at);
            const last = new Date(points[points.length - 1].recorded_at);
            const durationMinutes = Math.round((last.getTime() - first.getTime()) / 60000);

            const { error: routeErr } = await supabase.from("lesson_routes").insert({
              lesson_id: session.lesson_id,
              telematics_id: session.id,
              instructor_id: session.instructor_id,
              pupil_id: session.pupil_id,
              coordinates,
              distance_km: session.total_distance_km ?? null,
              duration_minutes: durationMinutes,
              started_at: session.started_at,
              ended_at: endedAtIso,
            });
            if (routeErr) {
              console.error(`lesson_routes insert failed for ${session.id}:`, routeErr.message);
            }
          }
        }
      } catch (captureErr) {
        const cmsg = captureErr instanceof Error ? captureErr.message : String(captureErr);
        console.error(`Route capture error for ${session.id}:`, cmsg);
      }

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
