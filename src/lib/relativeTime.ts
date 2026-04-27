/**
 * Compact relative time labels for the pupil-picker Recent section.
 * "Just now" / "5 min" / "Yesterday" / "3 days" / "2 weeks" / "Mar 4"
 */
export function compactRelative(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return `${hours} hr`;
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
