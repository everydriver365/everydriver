import { supabase } from "@/integrations/supabase/client";

/**
 * On-demand Google Calendar freshness.
 *
 * Calls the `google-calendar-service` edge function `resyncRange` action so that
 * `instructor_calendar_events` (which every booking flow / clash check reads
 * from) reflects the latest Google state before we offer or confirm slots.
 *
 * Throttled per (instructor, from, to) via sessionStorage with a 60s TTL so
 * navigating between booking surfaces does not hammer the edge function.
 *
 * Failure is non-fatal — callers fall back to the cached events. Booking flows
 * should never block on a Google sync.
 */

const TTL_MS = 60_000;
const KEY_PREFIX = "gcal-refresh:";

function cacheKey(instructorId: string, fromIso: string, toIso: string): string {
  return `${KEY_PREFIX}${instructorId}:${fromIso}:${toIso}`;
}

function readTs(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeTs(key: string, ts: number): void {
  try {
    sessionStorage.setItem(key, String(ts));
  } catch {
    /* storage unavailable — that's fine */
  }
}

export interface RefreshArgs {
  instructorId: string;
  /** ISO datetime string (inclusive). */
  fromIso: string;
  /** ISO datetime string (exclusive). Must be > fromIso. */
  toIso: string;
  /** Skip the TTL guard and always call the edge function. */
  force?: boolean;
}

export interface RefreshResult {
  ok: boolean;
  /** True when the call was skipped because of the TTL. */
  skipped?: boolean;
  /** Edge-function error message when ok=false. */
  error?: string;
}

export async function refreshGoogleCalendar(
  args: RefreshArgs,
): Promise<RefreshResult> {
  const { instructorId, fromIso, toIso, force } = args;
  if (!instructorId || !fromIso || !toIso) {
    return { ok: false, error: "missing-args" };
  }

  const key = cacheKey(instructorId, fromIso, toIso);
  const last = readTs(key);
  if (!force && last && Date.now() - last < TTL_MS) {
    return { ok: true, skipped: true };
  }

  // Mark first to avoid duplicate parallel calls within the TTL window.
  writeTs(key, Date.now());

  try {
    const { data, error } = await supabase.functions.invoke(
      "google-calendar-service",
      {
        body: {
          action: "resyncRange",
          instructorId,
          fromDate: fromIso,
          toDate: toIso,
        },
      },
    );

    if (error) {
      // Reset the timestamp so we'll retry sooner.
      writeTs(key, 0);
      return { ok: false, error: error.message };
    }

    if (data && (data as any).error) {
      writeTs(key, 0);
      return { ok: false, error: String((data as any).error) };
    }

    return { ok: true };
  } catch (e) {
    writeTs(key, 0);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

/**
 * Convenience: refresh a single calendar day for an instructor.
 */
export function refreshGoogleCalendarForDate(
  instructorId: string,
  date: Date | string,
  force = false,
): Promise<RefreshResult> {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return refreshGoogleCalendar({
    instructorId,
    fromIso: start.toISOString(),
    toIso: end.toISOString(),
    force,
  });
}
