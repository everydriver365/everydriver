/**
 * Bottom-nav icon family — line-style, single visual hand.
 *
 * Spec: 24×24 viewBox, 1.8px stroke, round line caps + joins, no fill.
 * The Track icon's centre dot becomes a solid fill when `active` is true
 * (so the active state reads as a "you're here" target). All other icons
 * stay pure outline in both states; colour is driven entirely by the
 * parent via `currentColor`.
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; active?: boolean };

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HomeNavIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1h3.5v-5.5h4V20H17.5a1 1 0 0 0 1-1V9.8" />
    </svg>
  );
}

export function ScheduleNavIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
    </svg>
  );
}

export function TrackNavIcon({ size = 24, active = false, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="6.5" />
      {/* directional ticks */}
      <path d="M12 2.5v2.5" />
      <path d="M12 19v2.5" />
      <path d="M2.5 12H5" />
      <path d="M19 12h2.5" />
      {/* centre dot — solid fill when active */}
      <circle
        cx="12"
        cy="12"
        r="1.6"
        fill={active ? "currentColor" : "none"}
        stroke={active ? "none" : "currentColor"}
      />
    </svg>
  );
}

export function MoneyNavIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      {/* simplified £ glyph in a single line family */}
      <path d="M15.5 6.5a3.5 3.5 0 0 0-6 2.5v3" />
      <path d="M7.5 12.5h6" />
      <path d="M9.5 11.8c0 2.4-.7 4.3-2 5.7h8.5" />
    </svg>
  );
}

export function PupilsNavIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" />
    </svg>
  );
}

export function MenuNavIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </svg>
  );
}
