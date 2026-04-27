/**
 * Premium tile-system score badge — small coloured pill used on the
 * recorded sessions list to surface a per-session score at a glance.
 *
 * Renders nothing when `score` is null/undefined so callers can pass the
 * raw value without guarding upstream.
 */

export interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

function paletteForScore(score: number): { bg: string; fg: string } {
  if (score >= 90) return { bg: "#E8F3E8", fg: "#3B8B3B" };
  if (score >= 70) return { bg: "#E6F1FB", fg: "#2B7BC8" };
  if (score >= 50) return { bg: "#FBF1DE", fg: "#B8801F" };
  return { bg: "#FBEAEC", fg: "#C8434F" };
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null || score === undefined || !isFinite(score)) return null;
  const rounded = Math.round(score);
  const { bg, fg } = paletteForScore(rounded);
  return (
    <span
      className={className}
      style={{
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 500,
        padding: "2px 6px",
        borderRadius: 4,
        fontFamily: FONT_STACK,
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
      }}
    >
      {rounded}
    </span>
  );
}
