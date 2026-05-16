/**
 * Dual-write helpers for weekly working hours.
 *
 * Historically the project has two tables that store the same concept:
 *   - instructor_working_hours (day_of_week: 0=Sun..6=Sat)
 *   - availability_windows      (day_of_week: 1=Mon..7=Sun)
 *
 * Different booking surfaces read different tables. To prevent drift (e.g. the
 * "Ken D shows no availability" bug), every editor must write to BOTH tables.
 *
 * These helpers replace the full day of rows in the partner table for a given
 * instructor so both tables agree after every save.
 */
import { supabase } from "@/integrations/supabase/client";

/** instructor_working_hours dow -> availability_windows dow */
export const iwhDowToAwDow = (dow: number): number => (dow === 0 ? 7 : dow);

/** availability_windows dow -> instructor_working_hours dow */
export const awDowToIwhDow = (dow: number): number => (dow === 7 ? 0 : dow);

const norm = (t: string) => (t.length === 5 ? `${t}:00` : t);

/**
 * After writing to `instructor_working_hours`, mirror the same instructor's
 * full week into `availability_windows`.
 */
export async function mirrorIwhToAw(instructorId: string): Promise<void> {
  const { data, error } = await supabase
    .from("instructor_working_hours")
    .select("day_of_week, start_time, end_time, is_active")
    .eq("instructor_id", instructorId);
  if (error) throw error;

  // Replace all aw rows for this instructor across every day.
  const del = await supabase
    .from("availability_windows")
    .delete()
    .eq("instructor_id", instructorId);
  if (del.error) throw del.error;

  const rows = (data ?? [])
    .filter((r) => r.is_active)
    .map((r) => ({
      instructor_id: instructorId,
      day_of_week: iwhDowToAwDow(r.day_of_week),
      start_time: norm(r.start_time),
      end_time: norm(r.end_time),
      is_active: true,
    }));
  if (rows.length === 0) return;
  const ins = await supabase.from("availability_windows").insert(rows);
  if (ins.error) throw ins.error;
}

/**
 * After writing to `availability_windows`, mirror the same instructor's
 * full week into `instructor_working_hours`.
 *
 * Uses upsert keyed by (instructor_id, day_of_week) so existing rows are
 * replaced rather than duplicated.
 */
export async function mirrorAwToIwh(instructorId: string): Promise<void> {
  const { data, error } = await supabase
    .from("availability_windows")
    .select("day_of_week, start_time, end_time, is_active")
    .eq("instructor_id", instructorId);
  if (error) throw error;

  // Collapse: pick the earliest start + latest end per day so the single-row
  // iwh shape still spans every window. (iwh is unique on (instructor,dow).)
  const byDay = new Map<number, { start: string; end: string }>();
  for (const r of data ?? []) {
    if (!r.is_active) continue;
    const dow = awDowToIwhDow(r.day_of_week);
    const cur = byDay.get(dow);
    const start = norm(r.start_time);
    const end = norm(r.end_time);
    if (!cur) byDay.set(dow, { start, end });
    else byDay.set(dow, {
      start: start < cur.start ? start : cur.start,
      end: end > cur.end ? end : cur.end,
    });
  }

  // Wipe then re-insert so disabled days disappear from iwh too.
  const del = await supabase
    .from("instructor_working_hours")
    .delete()
    .eq("instructor_id", instructorId);
  if (del.error) throw del.error;

  const rows = Array.from(byDay.entries()).map(([dow, w]) => ({
    instructor_id: instructorId,
    day_of_week: dow,
    start_time: w.start,
    end_time: w.end,
    is_active: true,
  }));
  if (rows.length === 0) return;
  const ins = await supabase.from("instructor_working_hours").insert(rows);
  if (ins.error) throw ins.error;
}
