import { useEffect, useRef } from "react";
import { refreshGoogleCalendar } from "@/lib/refreshGoogleCalendar";

interface Args {
  instructorId: string | undefined;
  /** Date object or yyyy-MM-dd string for the start of the window. */
  from: Date | string | undefined;
  /** Date object or yyyy-MM-dd string for the end of the window. */
  to: Date | string | undefined;
  /**
   * Set false to disable the refresh entirely (e.g. when a sheet is closed).
   * Defaults to true.
   */
  enabled?: boolean;
}

function toIsoStart(v: Date | string): string {
  const d = typeof v === "string" ? new Date(`${v}T00:00:00`) : new Date(v);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoEnd(v: Date | string): string {
  const d = typeof v === "string" ? new Date(`${v}T00:00:00`) : new Date(v);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

/**
 * Refresh `instructor_calendar_events` from Google for the given window when a
 * booking surface mounts (or when the window changes).
 *
 * Throttled per (instructor, range) by `refreshGoogleCalendar`'s sessionStorage
 * TTL — safe to mount on every booking page without flooding the edge function.
 *
 * Use on every UI that lets a user pick a slot:
 *   - public course booking (LessonScheduler)
 *   - instructor add / reschedule sheets
 *   - find-a-slot search
 *   - pupil self-booking calendar
 */
export function useGoogleCalendarRefresh({ instructorId, from, to, enabled = true }: Args) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!instructorId || !from || !to) return;

    const fromIso = toIsoStart(from);
    const toIso = toIsoEnd(to);
    if (fromIso >= toIso) return;

    const key = `${instructorId}:${fromIso}:${toIso}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    // Fire and forget — never block the UI.
    void refreshGoogleCalendar({ instructorId, fromIso, toIso });
  }, [enabled, instructorId, from, to]);
}
