import { CSSProperties } from "react";

// Static imports — tree-shakeable, Vite bundles + hashes each asset.
import pencilsCup from "@/assets/icons-3d/pencils-cup.png";
import barChart from "@/assets/icons-3d/bar-chart.png";
import road from "@/assets/icons-3d/road.png";
import barrier from "@/assets/icons-3d/barrier.png";
import calendar from "@/assets/icons-3d/calendar.png";
import user from "@/assets/icons-3d/user.png";
import wallet from "@/assets/icons-3d/wallet.png";
import car from "@/assets/icons-3d/car.png";

/**
 * Registry of available 3D clay-style PNG icons.
 * Add new entries here as more icons are generated into src/assets/icons-3d/.
 */
export const ICON_3D_REGISTRY = {
  "pencils-cup": pencilsCup,
  "bar-chart": barChart,
  road,
  barrier,
  calendar,
  user,
  wallet,
  car,
} as const;

export type Icon3DName = keyof typeof ICON_3D_REGISTRY;

export function hasIcon3D(name: string): name is Icon3DName {
  return name in ICON_3D_REGISTRY;
}

interface Icon3DProps {
  name: Icon3DName | string;
  size?: number;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a 3D claymorphism icon as a PNG. Returns null when the name has
 * no registered asset — callers should provide their own fallback
 * (e.g. a Lucide icon) using `hasIcon3D()`.
 */
export function Icon3D({ name, size = 44, alt, className, style }: Icon3DProps) {
  if (!hasIcon3D(name)) return null;
  const src = ICON_3D_REGISTRY[name];
  return (
    <img
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    />
  );
}
