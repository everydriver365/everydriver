// Client helper: push freshly-inserted lessons to Google Calendar
// synchronously. If Google rejects we no longer roll back the DB rows —
// instead we mark them `pending` so the `process-calendar-queue` cron retries
// them, and surface a non-blocking warning toast. Losing the booking entirely
// is strictly worse than a short retry window.

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Result {
  ok: boolean;
  failedIds: string[];
  /** True when Google sync failed and the rows were deferred to the retry queue. */
  deferred: boolean;
}

/**
 * Calls the sync-lesson-now edge function for each lesson id.
 *
 * - Returns { ok: true, deferred: false } when every lesson is on Google (or
 *   benignly skipped — e.g. instructor has not connected Google).
 * - Returns { ok: true, deferred: true } when one or more lessons could not be
 *   pushed; the rows are kept and marked `pending` for the cron retry. Callers
 *   should treat this as success so the booking flow completes.
 */
export async function syncLessonsOrRollback(lessonIds: string[]): Promise<Result> {
  const failed: string[] = [];

  for (const lessonId of lessonIds) {
    try {
      const { data, error } = await supabase.functions.invoke("sync-lesson-now", {
        body: { lessonId },
      });
      if (error || (data && data.ok === false)) {
        failed.push(lessonId);
      }
    } catch (err) {
      console.error("sync-lesson-now invoke failed:", err);
      failed.push(lessonId);
    }
  }

  if (failed.length === 0) {
    return { ok: true, failedIds: [], deferred: false };
  }

  // Keep the lesson rows but mark them pending so the cron retry picks them up.
  await supabase
    .from("scheduled_lessons")
    .update({ calendar_sync_status: "pending" })
    .in("id", failed);

  toast.warning(
    "Lesson saved. We'll keep trying to add it to your Google Calendar in the background.",
  );

  return { ok: true, failedIds: failed, deferred: true };
}

export default syncLessonsOrRollback;
