/**
 * Line-style header icon family.
 *
 * Same hand as the bottom-nav icons: 1.8px stroke, rounded caps and joins,
 * `currentColor` so the parent button drives the tint. 20×20 by default
 * to match the header's tap-target spec (~36×36 with padding).
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

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

export function ChevronLeftHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function BellHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M6 16.5h12V15c-1 0-1.7-.7-1.7-1.7V10a4.3 4.3 0 0 0-8.6 0v3.3C7.7 14.3 7 15 7 15Z" />
      <path d="M10.5 19.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

export function PlusHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function MoonHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

export function SunHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="m5.6 5.6 1.4 1.4" />
      <path d="m17 17 1.4 1.4" />
      <path d="m5.6 18.4 1.4-1.4" />
      <path d="m17 7 1.4-1.4" />
    </svg>
  );
}

export function MenuHeaderIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </svg>
  );
}
