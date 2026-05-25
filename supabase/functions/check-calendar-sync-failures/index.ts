// Daily check: notify instructors of lessons whose Google Calendar sync failed
// over an hour ago and have not yet been alerted. Sets calendar_sync_alerted_at
// to prevent re-alerting for the same lesson.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { raiseSyncAlert } from "../_shared/raiseSyncAlert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: failed, error } = await supabase
      .from("scheduled_lessons")
      .select("id, instructor_id, lesson_date, start_time")
      .eq("calendar_sync_status", "failed")
      .lt("updated_at", cutoff)
      .is("calendar_sync_alerted_at", null)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .limit(500);

    if (error) throw error;

    let notified = 0;
    for (const lesson of failed ?? []) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-instructor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            instructorId: lesson.instructor_id,
            type: "admin_message",
            title: "Google Calendar sync failed",
            body: `Google Calendar sync failed for your lesson on ${lesson.lesson_date} at ${lesson.start_time}. Please check your Google Calendar connection in settings.`,
          }),
        });

        await supabase
          .from("scheduled_lessons")
          .update({ calendar_sync_alerted_at: new Date().toISOString() })
          .eq("id", lesson.id);

        notified++;
      } catch (e) {
        console.error(`Failed to notify for lesson ${lesson.id}:`, (e as Error).message);
      }
      // Also raise an admin alert per failed lesson (deduped server-side).
      void raiseSyncAlert({
        category: "other",
        severity: "high",
        title: "Lesson sync failed > 1h",
        message: `Lesson ${lesson.id} on ${lesson.lesson_date} ${lesson.start_time} still failed after 1h.`,
        instructorId: lesson.instructor_id,
        lessonId: lesson.id,
        supabase,
      });
    }

    // ── Orphan lessons: no google_event_id but should be synced ──────────
    const { data: orphans } = await supabase
      .from("scheduled_lessons")
      .select("id, instructor_id, lesson_date, start_time")
      .is("google_event_id", null)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .neq("calendar_sync_status", "no-calendar")
      .gte("lesson_date", new Date().toISOString().slice(0, 10))
      .limit(200);

    for (const o of orphans ?? []) {
      void raiseSyncAlert({
        category: "orphan_lesson",
        severity: "medium",
        title: "Lesson has no Google event id",
        message: `Future lesson ${o.id} (${o.lesson_date} ${o.start_time}) exists in app but not on Google Calendar.`,
        instructorId: o.instructor_id,
        lessonId: o.id,
        supabase,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, found: failed?.length ?? 0, notified, orphans: orphans?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("check-calendar-sync-failures error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
