// Single entry point for user-initiated lesson removal.
//
// Always prefer this over a hard `.delete()` (which is reserved for failed-sync
// rollback paths in syncLessonsOrRollback). Sets `deleted_at = now()` so the
// row is preserved for audit, then synchronously invokes `sync-lesson-now`
// so the Google Calendar event is removed in-line — the queue trigger remains
// as a safety net but we don't depend on it to free the slot.

import { supabase } from "@/integrations/supabase/client";

interface Options {
  cancelledBy?: string;
  reason?: string;
}

export async function softDeleteLesson(
  lessonId: string,
  opts: Options = {},
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("scheduled_lessons")
    .update({
      deleted_at: new Date().toISOString(),
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: opts.cancelledBy ?? "instructor",
      cancellation_reason: opts.reason ?? "Lesson deleted",
    } as any)
    .eq("id", lessonId);

  if (error) return { ok: false, error: error.message };

  // Fire-and-await Google delete so the slot is freed before we return.
  try {
    await supabase.functions.invoke("sync-lesson-now", { body: { lessonId } });
  } catch (err) {
    console.error("softDeleteLesson: sync-lesson-now invoke failed", err);
    // Trigger has already enqueued deleteLesson — the cron worker will retry.
  }

  return { ok: true };
}
