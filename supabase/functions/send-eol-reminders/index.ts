// End-of-Lesson reminder pass. Runs every 5 min via pg_cron.
// For each instructor with `end_of_lesson_enabled = true`, finds lessons whose
// computed end time falls inside the next window
// `[now + lead_minutes - 2.5min, now + lead_minutes + 2.5min]` and pushes a
// "Mark lesson complete" notification. Idempotent via `eol_sent_at` column on
// scheduled_lessons (added by the migration).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: settingsRows } = await admin
      .from("instructor_notification_settings")
      .select("instructor_id, end_of_lesson_enabled, end_of_lesson_lead_minutes")
      .eq("end_of_lesson_enabled", true);

    if (!settingsRows?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const sentLessons: string[] = [];

    for (const s of settingsRows) {
      const lead = Number(s.end_of_lesson_lead_minutes ?? 0);
      // Find lessons today/tomorrow whose end time is within ±2.5 min of (now + lead).
      const target = new Date(now.getTime() + lead * 60_000);
      const winStart = new Date(target.getTime() - 150_000);
      const winEnd = new Date(target.getTime() + 150_000);

      const dateStr = target.toISOString().slice(0, 10);

      const { data: lessons } = await admin
        .from("scheduled_lessons")
        .select("id, pupil_id, lesson_date, start_time, duration_minutes, eol_sent_at")
        .eq("instructor_id", s.instructor_id)
        .eq("lesson_date", dateStr)
        .neq("status", "cancelled")
        .is("deleted_at", null)
        .is("eol_sent_at", null);

      for (const l of lessons ?? []) {
        const startIso = `${l.lesson_date}T${l.start_time}`;
        const startMs = new Date(startIso).getTime();
        const endMs = startMs + Number(l.duration_minutes ?? 60) * 60_000;
        if (endMs < winStart.getTime() || endMs > winEnd.getTime()) continue;

        const gate = await shouldSendToInstructor(admin, s.instructor_id, {
          category: "lesson",
          channel: "push",
          importance: "normal",
        });

        // Always write the inbox row (so the bell shows it even if push gated).
        await admin.from("instructor_notifications").insert({
          instructor_id: s.instructor_id,
          title: "Lesson ending soon",
          message: lead === 0 ? "Lesson is ending now — mark it complete." : `Lesson ends in ${lead} min — get ready to mark it complete.`,
          type: "lesson_eol",
          action_url: `/instructor/lessons/${l.id}`,
          metadata: { lesson_id: l.id, pupil_id: l.pupil_id, lead_minutes: lead },
        });

        if (gate.allow) {
          await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              instructorId: s.instructor_id,
              category: "lesson",
              importance: "normal",
              bypassGate: true, // we've already gated above
              notification: {
                title: "Lesson ending soon",
                body: lead === 0
                  ? "Lesson is ending now — tap to mark complete."
                  : `Lesson ends in ${lead} min — tap to mark complete.`,
                tag: `eol-${l.id}`,
                data: { type: "lesson_eol", lesson_id: l.id, url: `/instructor/lessons/${l.id}` },
              },
            }),
          }).catch((e) => console.error("[send-eol-reminders] push fetch", e));
        } else {
          console.log(`[send-eol-reminders] gate blocked push for lesson ${l.id}: ${gate.reason}`);
        }

        await admin
          .from("scheduled_lessons")
          .update({ eol_sent_at: new Date().toISOString() })
          .eq("id", l.id);
        sentLessons.push(l.id);
      }
    }

    return new Response(JSON.stringify({ processed: sentLessons.length, lessons: sentLessons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-eol-reminders error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
