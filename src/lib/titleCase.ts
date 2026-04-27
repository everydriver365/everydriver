/**
 * Display-only title casing for human names.
 * Preserves apostrophes, hyphens, and Mc/Mac-style names.
 * Does not mutate stored data.
 */
export function titleCaseName(raw: string | null | undefined): string {
  if (!raw) return "";
  const lower = String(raw).trim().toLowerCase();
  if (!lower) return "";
  return lower
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      return part
        .split("-")
        .map((seg) =>
          seg
            .split("'")
            .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
            .join("'"),
        )
        .join("-");
    })
    .join("");
}
