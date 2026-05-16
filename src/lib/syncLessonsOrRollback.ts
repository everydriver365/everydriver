// Client helper: push freshly-inserted lessons to Google Calendar
// synchronously, and roll back the DB rows if Google rejects.
//
// Per mem://constraints/google-calendar-source-of-truth the availability
// engine only consults Google Calendar + manual blocks. Every manual lesson
// insert in the instructor portal MUST therefore call this helper right
// after the DB insert, so the slot is never visible-as-busy in the CRM
// without also being on the instructor's Google Calendar.

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Result {
  ok: boolean;
  failedIds: string[];
  /** True when the inserts were rolled back. */
  rolledBack: boolean;
}

/**
 * Calls the sync-lesson-now edge function for each lesson id.
 * On any failure, deletes the failed lesson rows (and only those) so the
 * slot is released, then surfaces a toast.
 *
 * Returns { ok: true } only when every lesson is on Google (or benignly
 * skipped — e.g. instructor has not connected Google).
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
    return { ok: true, failedIds: [], rolledBack: false };
  }

  // Roll back the failed inserts so the slot is released.
  await supabase.from("scheduled_lessons").delete().in("id", failed);

  toast.error(
    "Couldn't add lesson to your Google Calendar — the slot has been released. Check Settings → Integrations.",
  );

  return { ok: false, failedIds: failed, rolledBack: true };
}
