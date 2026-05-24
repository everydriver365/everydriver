// Client helper: push freshly-inserted lessons to Google Calendar
// synchronously. If Google rejects (or the call exceeds the 5s wall-clock
// budget) we no longer roll back the DB rows — instead we mark them `pending`
// so the `process-calendar-queue` cron retries them, and surface a non-blocking
// warning toast. Losing the booking entirely is strictly worse than a short
// retry window.

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Result {
  ok: boolean;
  failedIds: string[];
  /** True when Google sync failed/timed-out and the rows were deferred to the retry queue. */
  deferred: boolean;
}

const SYNC_TIMEOUT_MS = 5_000;

async function invokeWithTimeout(lessonId: string): Promise<{ timedOut: boolean; failed: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.functions.invoke("sync-lesson-now", { body: { lessonId } }),
      new Promise<{ timedOut: true }>((resolve) => {
        timer = setTimeout(() => resolve({ timedOut: true }), SYNC_TIMEOUT_MS);
      }),
    ]);
    if ((result as { timedOut?: boolean }).timedOut) {
      return { timedOut: true, failed: true };
    }
    const { data, error } = result as { data: any; error: any };
    if (error || (data && data.ok === false)) return { timedOut: false, failed: true };
    return { timedOut: false, failed: false };
  } catch (err) {
    console.error("sync-lesson-now invoke failed:", err);
    return { timedOut: false, failed: true };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function syncLessonsOrRollback(lessonIds: string[]): Promise<Result> {
  const failed: string[] = [];
  let anyTimedOut = false;

  for (const lessonId of lessonIds) {
    const r = await invokeWithTimeout(lessonId);
    if (r.failed) failed.push(lessonId);
    if (r.timedOut) anyTimedOut = true;
  }

  if (failed.length === 0) {
    return { ok: true, failedIds: [], deferred: false };
  }

  await supabase
    .from("scheduled_lessons")
    .update({ calendar_sync_status: "pending" })
    .in("id", failed);

  toast.message(
    anyTimedOut
      ? "Saved — syncing to Google in the background"
      : "Lesson saved. We'll keep trying to add it to your Google Calendar in the background.",
  );

  return { ok: true, failedIds: failed, deferred: true };
}

export default syncLessonsOrRollback;
