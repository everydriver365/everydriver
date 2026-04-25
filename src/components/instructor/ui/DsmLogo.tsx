/**
 * DSM brand mark — three rounded squares with the letters D, S, M.
 *
 * Used in the global app header and re-usable on splash / login / share
 * cards. The 3px gap between squares is intentional: equal rounded corners
 * on every side of every square, never flush. Brand colours are the only
 * saturated colour allowed in the otherwise restrained header.
 */

import type { CSSProperties } from "react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

const SQUARES: ReadonlyArray<{ letter: string; bg: string; darkBg?: string }> = [
  { letter: "D", bg: "#C8434F" },
  { letter: "S", bg: "#2B7BC8" },
  // In dark mode bump the M square so it isn't lost against #1C1C1E
  { letter: "M", bg: "#1F1F1F", darkBg: "#2C2C2E" },
];

export interface DsmLogoProps {
  /** Edge length of each square, in px. Defaults to 24. */
  size?: number;
  /** When true, swap the M square to its dark-mode background. */
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function DsmLogo({ size = 24, dark = false, className, style }: DsmLogoProps) {
  const fontSize = Math.round(size * 0.55);
  return (
    <div
      role="img"
      aria-label="DSM"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        flexShrink: 0,
        ...style,
      }}
    >
      {SQUARES.map(({ letter, bg, darkBg }) => (
        <span
          key={letter}
          aria-hidden
          style={{
            width: size,
            height: size,
            borderRadius: 4,
            background: dark && darkBg ? darkBg : bg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize,
            fontWeight: 500,
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
