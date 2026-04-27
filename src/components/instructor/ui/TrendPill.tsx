import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Premium tile-system trend pill — point-change variant.
 *
 * Used on the Driving Report and shared across dashboards. Matches the
 * Earnings dashboard / WeekAtAGlance pattern but accepts a signed `delta`
 * (point change) instead of a percentage so callers can show "+3" / "-2"
 * on a 100-point scale where percentages would mislead.
 *
 * Pass `delta = null` (or 0 with `hideFlat`) to render nothing.
 */

export interface TrendPillProps {
  /** Signed point change vs comparison period. `null` hides the pill. */
  delta: number | null;
  /** Hide entirely when delta === 0 (flat). Default: true. */
  hideFlat?: boolean;
  /** Optional override for the displayed label (e.g. "+3pts"). */
  label?: ReactNode;
  className?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export function TrendPill({
  delta,
  hideFlat = true,
  label,
  className,
}: TrendPillProps) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0 && hideFlat) return null;

  const isUp = delta > 0;
  const bg = isUp ? "#E8F3E8" : delta < 0 ? "#FBEAEC" : "#F2F2F4";
  const color = isUp ? "#3B8B3B" : delta < 0 ? "#C8434F" : "#6E6E73";
  const Icon = isUp ? ArrowUp : ArrowDown;
  const formatted =
    label ?? `${delta > 0 ? "+" : ""}${delta}`;

  return (
    <span
      className={className}
      style={{
        background: bg,
        borderRadius: 4,
        padding: "1px 5px",
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color,
        fontSize: 9,
        fontWeight: 500,
        lineHeight: 1.2,
        fontFamily: FONT_STACK,
      }}
    >
      {delta !== 0 && <Icon size={8} strokeWidth={1.6} color={color} />}
      {formatted}
    </span>
  );
}
