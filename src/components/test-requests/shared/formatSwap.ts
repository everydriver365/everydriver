import { format, parseISO, differenceInDays } from "date-fns";

const isGB = () => {
  if (typeof navigator === "undefined") return true;
  return (navigator.language || "en-GB").toLowerCase().startsWith("en-gb") ||
    !navigator.language?.toLowerCase().startsWith("en-us");
};

export function formatSwapDate(start: string, end?: string | null): string {
  if (!start) return "";
  const s = parseISO(start);
  if (end) {
    const e = parseISO(end);
    if (s.getFullYear() === e.getFullYear()) {
      return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
    }
    return `${format(s, "d MMM yyyy")} – ${format(e, "d MMM yyyy")}`;
  }
  return format(s, "d MMM yyyy");
}

function fmtTime(t: string): string {
  const [h, m] = t.split(":");
  if (isGB()) return `${h.padStart(2, "0")}:${m}`;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m}${ampm}`;
}

export function formatSwapTime(start: string, end?: string | null): string {
  if (!start) return "";
  const s = fmtTime(start);
  if (end) return `${s} – ${fmtTime(end)}`;
  return s;
}

/**
 * Short, human-readable date label for form inputs.
 * - Same year as today → "18 Feb"
 * - Other year → "18 Feb 2027"
 * Pass `pairedYear` (the other end of a range) to force showing the year
 * when only one side spans a different year.
 */
export function formatShortDate(date: Date, pairedYear?: number): string {
  const currentYear = new Date().getFullYear();
  const y = date.getFullYear();
  const showYear = y !== currentYear || (pairedYear != null && pairedYear !== y);
  return format(date, showYear ? "d MMM yyyy" : "d MMM");
}

/** Time formatter mirroring `fmtTime` for shared use in form inputs. */
export function formatShortTime(time: string): string {
  if (!time) return "";
  return fmtTime(time);
}

export function formatTestCentre(name?: string | null): string {
  if (!name) return "Test centre";
  const trimmed = name.trim();
  if (/test centre$/i.test(trimmed)) return trimmed;
  return `${trimmed} test centre`;
}

export function postedAgoLabel(createdAt: string): string {
  const days = differenceInDays(new Date(), parseISO(createdAt));
  if (days <= 0) return "Shared with the swap board";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}
