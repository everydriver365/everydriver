// =============================================================================
// process-calendar-queue/index.ts
// =============================================================================
//
// Deploy as: supabase/functions/process-calendar-queue/index.ts
//
// Cron-driven retry for lessons whose Google Calendar sync failed or is
// pending (awaiting_initial_payment, transient Google errors, etc.).
//
// Processes up to 50 items per run, deduplicated per lesson_id (latest wins).
// Uses syncLessonNow from the shared helper — no duplicate calendar logic.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncLessonNow } from "../_shared/googleCalendarSync.ts";
import { sendWhatsAppTemplate } from "../_shared/whatsapp-template.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_PAYMENT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // ── Fetch pending queue items ─────────────────────────────────────────
    const { data: items, error: qErr } = await supabase
      .from("calendar_sync_queue")
      .select("*")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (qErr) throw qErr;
    if (!items?.length) return json({ success: true, processed: 0 });

    // ── Deduplicate: per lesson_id keep the latest item ───────────────────
    const byLesson = new Map<string, any>();
    const dupIds:   string[] = [];
    for (const item of items) {
      const existing = byLesson.get(item.lesson_id);
      if (existing) dupIds.push(existing.id);
      byLesson.set(item.lesson_id, item);
    }
    if (dupIds.length > 0) {
      await supabase.from("calendar_sync_queue")
        .update({ processed_at: new Date().toISOString(), error: "Deduplicated" })
        .in("id", dupIds);
    }

    const unique = Array.from(byLesson.values());
    let successCount = 0;
    let errorCount   = 0;

    for (const item of unique) {
      try {
        if (item.action === "syncLesson" || !item.action) {
          // Check awaiting_initial_payment before attempting sync.
          const { data: lesson } = await supabase
            .from("scheduled_lessons")
            .select("id, status, awaiting_initial_payment, google_event_id, " +
                    "lesson_date, start_time, duration_minutes, " +
                    "pupils:pupil_id(id, name, phone, whatsapp_opt_in, whatsapp_confirmed_at)")
            .eq("id", item.lesson_id)
            .maybeSingle();

          if (!lesson) {
            await markProcessed(supabase, item.id, "Lesson not found");
            continue;
          }

          if ((lesson as any).awaiting_initial_payment) {
            const ageMs = Date.now() - new Date(item.created_at ?? 0).getTime();
            if (ageMs > STALE_PAYMENT_MS) {
              await markProcessed(supabase, item.id, "Awaiting payment — timed out");
            }
            // else: leave in queue, next run will try again.
            continue;
          }

          // Delegate to the shared helper — no duplicated calendar logic here.
          const result = await syncLessonNow(supabase, item.lesson_id);

          if (result.ok) {
            // Send WhatsApp on first successful sync if pupil opted in.
            const isNew  = !(lesson as any).google_event_id;
            const pupil  = (lesson as any).pupils as any;
            if (isNew && pupil?.phone && pupil?.whatsapp_opt_in && !pupil?.whatsapp_confirmed_at) {
              try {
                const waResult = await sendWhatsAppTemplate({
                  supabase,
                  instructorId: item.instructor_id,
                  to:           pupil.phone,
                  templateName: "lesson_confirmation",
                  variables: [
                    pupil.name,
                    (lesson as any).lesson_date,
                    ((lesson as any).start_time ?? "").slice(0, 5),
                    "your pickup point",
                  ],
                  pupilId: pupil.id,
                });
                if (waResult.ok) {
                  await supabase.from("pupils")
                    .update({ whatsapp_confirmed_at: new Date().toISOString() })
                    .eq("id", pupil.id);
                }
              } catch (waErr) {
                console.warn("WhatsApp (non-fatal):", waErr);
              }
            }
          }

        } else if (item.action === "deleteLesson") {
          // deleteLesson items are handled by syncLessonNow when status='cancelled',
          // but if they arrive here directly we honour them.
          const { data: lesson } = await supabase
            .from("scheduled_lessons")
            .select("id, status, google_event_id, instructor_id")
            .eq("id", item.lesson_id)
            .maybeSingle();

          if (lesson && (lesson as any).google_event_id) {
            // Update status to cancelled so syncLessonNow deletes the event.
            await supabase.from("scheduled_lessons")
              .update({ status: "cancelled" })
              .eq("id", item.lesson_id);
            await syncLessonNow(supabase, item.lesson_id);
          }
        }

        await markProcessed(supabase, item.id);
        successCount++;
      } catch (err) {
        console.error(`Queue item ${item.id} failed:`, err);
        await supabase.from("scheduled_lessons")
          .update({ calendar_sync_status: "failed" })
          .eq("id", item.lesson_id);
        await markProcessed(supabase, item.id, err instanceof Error ? err.message : "Unknown error");
        errorCount++;
      }
    }

    // ── Purge processed items older than 7 days ───────────────────────────
    await supabase.from("calendar_sync_queue")
      .delete()
      .lt("processed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return json({ success: true, processed: successCount, errors: errorCount });
  } catch (err) {
    console.error("process-calendar-queue error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function markProcessed(supabase: any, id: string, error?: string) {
  await supabase.from("calendar_sync_queue")
    .update({ processed_at: new Date().toISOString(), ...(error ? { error } : {}) })
    .eq("id", id);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
