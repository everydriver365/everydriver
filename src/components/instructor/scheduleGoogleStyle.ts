// Shared helpers for the Google Calendar–style Schedule view.

export type EventCategory = "lesson" | "blocked" | "holiday" | "course" | "admin" | "task";

export interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
}

// Premium tile palette — pale tints with black titles & system-grey secondary text.
// Border colours retained for the optional left accent (rendered as a thin hairline).
export const CATEGORY_STYLES: Record<EventCategory, CategoryStyle> = {
  lesson:  { bg: "#E6F1FB", text: "#000000", border: "#2B7BC8" },
  blocked: { bg: "#F1ECFA", text: "#000000", border: "#8A5BC9" },
  holiday: { bg: "#E8F3E8", text: "#000000", border: "#3B8B3B" },
  course:  { bg: "#FBEAEC", text: "#000000", border: "#C8434F" },
  admin:   { bg: "#FBF1DE", text: "#000000", border: "#B8801F" },
  task:    { bg: "#F2F2F4", text: "#000000", border: "#6E6E73" },
};

/* ---------- Google Calendar live colour mapping ---------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const h = hex.trim().replace(/^#/, "");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const toHex = (n: number) => n.toString(16).padStart(2, "0");

function tintTowardWhite(rgb: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(rgb.r + (255 - rgb.r) * t);
  const g = Math.round(rgb.g + (255 - rgb.g) * t);
  const b = Math.round(rgb.b + (255 - rgb.b) * t);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shadeTowardBlack(rgb: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(rgb.r * (1 - t));
  const g = Math.round(rgb.g * (1 - t));
  const b = Math.round(rgb.b * (1 - t));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Build a Google-Calendar-style chip palette from the actual hex colour
 * stored on the event (mapped from Google's colorId on ingest).
 *  - border = the Google colour itself
 *  - bg     = tinted ~88% toward white
 *  - text   = shaded ~55% toward black for AA contrast
 */
export function styleFromGoogleColor(hex: string | null | undefined): CategoryStyle | null {
  const rgb = hexToRgb(hex || "");
  if (!rgb) return null;
  return {
    border: `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`,
    bg: tintTowardWhite(rgb, 0.88),
    // Black title text per premium tile spec — colour is reserved for the chip background.
    text: "#000000",
  };
}

const HOLIDAY_KEYWORDS = [
  "easter holiday",
  "school holiday",
  "half term",
  "summer holiday",
  "christmas holiday",
  "winter holiday",
  "spring break",
  "autumn holiday",
  "bank holiday",
];

const ADMIN_KEYWORDS = [
  "good friday",
  "easter sunday",
  "easter monday",
  "bank holiday",
  "public holiday",
  "new year",
  "boxing day",
  "christmas day",
];

const COURSE_KEYWORDS = [
  "wdu",
  "what's driving us",
  "whats driving us",
  "nsac",
  "national speed awareness",
  "speed awareness course",
  "classroom",
  "digital classroom",
  "workshop",
  "course",
];

const BLOCKED_KEYWORDS = [
  "unavailable",
  "college",
  "blocked",
  "busy",
  "holiday off",
  "personal",
  "break",
  "lunch",
  "meeting",
];

/**
 * Categorise a calendar item by title + a hint flag.
 * `kind` is the source ("lesson" | "external" | "block") so we can fall back
 * sensibly when keyword matching doesn't kick in.
 */
export function categoriseEvent(
  title: string,
  kind: "lesson" | "external" | "block",
  opts?: { isAllDay?: boolean; blockType?: string },
): EventCategory {
  const t = (title || "").toLowerCase();

  // Lessons in our DB are always teaching sessions.
  if (kind === "lesson") return "lesson";

  // Manual blocks: read block_type if present.
  if (kind === "block") {
    if (opts?.blockType === "task") return "task";
    if (opts?.blockType === "holiday") return "holiday";
    if (opts?.blockType === "course") return "course";
    return "blocked";
  }

  // External (Google Calendar) — keyword-driven.
  if (ADMIN_KEYWORDS.some((k) => t.includes(k))) return "admin";
  if (HOLIDAY_KEYWORDS.some((k) => t.includes(k))) return "holiday";
  if (COURSE_KEYWORDS.some((k) => t.includes(k))) return "course";
  if (BLOCKED_KEYWORDS.some((k) => t.includes(k))) return "blocked";

  // All-day externals without a keyword usually represent a context marker
  // (holiday/admin) rather than a teachable lesson.
  if (opts?.isAllDay) return "holiday";

  // Default fallback per spec, with a console warning for audit.
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.warn("[Schedule] Unmapped event category, defaulting to 'lesson':", title);
  }
  return "lesson";
}

/**
 * Strip redundant date/time prefixes from a title (display-only).
 * "02/04/2026 - 5pm - WDU - What's Driving Us Course"
 *  → "WDU - What's Driving Us Course"
 */
export function cleanEventTitle(raw: string): string {
  if (!raw) return raw;
  let s = raw.trim();

  // Leading date like "02/04/2026 - " or "2/4/26 -"
  s = s.replace(/^\s*\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s*[-–—:]\s*/, "");

  // Leading time like "5pm - ", "5:30pm - ", "17:00 - ", "5 pm - "
  s = s.replace(/^\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–—:]\s*/i, "");

  return s.trim();
}

/** Format minutes into "Xh", "Xh Ym", or "Ym". */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
