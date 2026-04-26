// Helpers for rendering Available Jobs offers — display-only formatting,
// never mutates stored data.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a UK postcode with the conventional space (e.g. "SO302TD" -> "SO30 2TD"). */
export function formatUkPostcode(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = input.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 5) return cleaned;
  // Outward = everything except final 3 chars; Inward = final 3 chars.
  const outward = cleaned.slice(0, cleaned.length - 3);
  const inward = cleaned.slice(-3);
  return `${outward} ${inward}`;
}

/** Sentence case: first letter upper, rest lower. */
export function toSentenceCase(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = input.replace(/[-_]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/** Format distance in miles. Returns null when value is missing or < 0.5. */
export function formatDistanceMiles(distance: number | null | undefined): string | null {
  if (distance == null || !Number.isFinite(distance) || distance < 0.5) return null;
  return `${distance.toFixed(1)} mi`;
}

interface TimingResult {
  label: string;
  urgent: boolean;
}

/** Convert raw timing strings into a human-readable label. */
export function formatTiming(raw: string | null | undefined): TimingResult {
  if (!raw) return { label: "Flexible", urgent: false };
  const value = raw.trim();
  const key = value.toLowerCase().replace(/[\s_]+/g, "-");

  switch (key) {
    case "asap":
    case "urgent":
    case "starts-asap":
      return { label: "Starts ASAP", urgent: true };
    case "this-week":
      return { label: "This week", urgent: false };
    case "next-week":
      return { label: "Next week", urgent: false };
    case "this-month":
      return { label: "This month", urgent: false };
    case "next-month":
      return { label: "Next month", urgent: false };
    case "flexible":
      return { label: "Flexible", urgent: false };
  }

  // ISO-ish date e.g. 2026-05-05 or 2026/05/05
  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { label: `From ${day} ${MONTHS[month - 1]}`, urgent: false };
    }
  }

  // Fallback: prettify kebab/snake by sentence-casing.
  return { label: toSentenceCase(value), urgent: false };
}

/** First letters from a name, max 2 chars (e.g. "Martin B" -> "MB"). */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase() || "?";
}

/** Title case each word for display (does not fix typos, only capitalisation). */
export function toTitleCase(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => (part.match(/^\s+$/) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

/** GBP integer currency formatter, e.g. 900 -> "£900". */
export function formatGbp(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

/** "Start ASAP" / "Start next week" — short headline derived from raw timing. */
export function formatTimingHeadline(raw: string | null | undefined): string {
  if (!raw) return "Start when ready";
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, "-");
  switch (key) {
    case "asap":
    case "urgent":
    case "starts-asap":
      return "Start ASAP";
    case "this-week":
      return "Start this week";
    case "next-week":
      return "Start next week";
    case "this-month":
      return "Start this month";
    case "next-month":
      return "Start next month";
    case "flexible":
      return "Flexible start";
  }
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) return "Start on date";
  return `Start ${toSentenceCase(raw).toLowerCase()}`;
}

/** Long human date "5 May 2026" from an ISO-ish string, or null if unparseable. */
export function formatLongDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!isoMatch) return null;
  const d = new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
