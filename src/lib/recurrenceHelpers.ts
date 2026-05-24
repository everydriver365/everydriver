import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch IDs of future sibling lessons in the same recurrence series.
 *
 * - Returns [] when the lesson is not part of a series.
 * - Excludes the current lesson, plus any sibling that is already
 *   `cancelled` or `completed`.
 * - "Future" is determined against (lesson_date, start_time) — only
 *   siblings strictly after `afterDateTime` are returned.
 *
 * Failures are swallowed so callers can safely degrade to single-lesson
 * behaviour. A warning is logged for diagnostics.
 */
export async function getFutureSiblings(
  supabase: SupabaseClient,
  lesson: { id: string; recurrence_parent_id: string | null },
  afterDateTime: Date,
): Promise<string[]> {
  if (!lesson.recurrence_parent_id) return [];

  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${afterDateTime.getFullYear()}-${pad(
      afterDateTime.getMonth() + 1,
    )}-${pad(afterDateTime.getDate())}`;
    const timeStr = `${pad(afterDateTime.getHours())}:${pad(
      afterDateTime.getMinutes(),
    )}:${pad(afterDateTime.getSeconds())}`;

    const { data, error } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, status")
      .eq("recurrence_parent_id", lesson.recurrence_parent_id)
      .neq("id", lesson.id)
      .not("status", "in", "(cancelled,completed)")
      .or(
        `lesson_date.gt.${dateStr},and(lesson_date.eq.${dateStr},start_time.gt.${timeStr})`,
      );

    if (error) {
      console.warn("getFutureSiblings: query failed", error);
      return [];
    }

    return (data ?? []).map((r: { id: string }) => r.id);
  } catch (err) {
    console.warn("getFutureSiblings: unexpected error", err);
    return [];
  }
}
