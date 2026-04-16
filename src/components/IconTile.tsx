import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  indigo:  { light: { bg: "#E8ECF1", icon: "#2A394F" }, dark: { bg: "#312E81", icon: "#C7D2FE" } },
  emerald: { light: { bg: "#ECFDF5", icon: "#059669" }, dark: { bg: "#064E3B", icon: "#A7F3D0" } },
  blue:    { light: { bg: "#E8ECF1", icon: "#2A394F" }, dark: { bg: "#1E3A8A", icon: "#BFDBFE" } },
  purple:  { light: { bg: "#EDE9FE", icon: "#5B21B6" }, dark: { bg: "#4C1D95", icon: "#DDD6FE" } },
  amber:   { light: { bg: "#FEF3C7", icon: "#92400E" }, dark: { bg: "#78350F", icon: "#FDE68A" } },
  red:     { light: { bg: "#FEF2F2", icon: "#DC2626" }, dark: { bg: "#7F1D1D", icon: "#FECACA" } },
  rose:    { light: { bg: "#FFE4E6", icon: "#BE123C" }, dark: { bg: "#881337", icon: "#FECDD3" } },
  neutral: { light: { bg: "#F4F4F5", icon: "#52525B" }, dark: { bg: "#27272A", icon: "#D4D4D8" } },
} as const;

const sizeMap = {
  sm: { tile: 32, icon: 16 },
  md: { tile: 44, icon: 22 },
  lg: { tile: 56, icon: 28 },
} as const;

export type IconTileColor = keyof typeof colorMap;
export type IconTileSize = keyof typeof sizeMap;

interface IconTileProps {
  icon: LucideIcon;
  color?: IconTileColor;
  size?: IconTileSize;
  className?: string;
}

export function IconTile({ icon: Icon, color = "neutral", size = "md", className }: IconTileProps) {
  const { tile, icon: iconSize } = sizeMap[size];
  const lightColors = colorMap[color].light;
  const darkColors = colorMap[color].dark;

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      style={{
        width: tile,
        height: tile,
        borderRadius: 12,
        backgroundColor: lightColors.bg,
      }}
    >
      <Icon size={iconSize} strokeWidth={2} color={lightColors.icon} />
      <style>{`
        @media (prefers-color-scheme: dark) {
          /* Dark mode handled via parent */
        }
      `}</style>
    </div>
  );
}

// Re-export color map for external use
export { colorMap as iconTileColors };
