import { ReactNode } from "react";
import { LucideIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TileColor = "purple" | "red" | "blue" | "emerald" | "amber" | "indigo";

// DSM brand palette: Red #E63329, Blue #1F86FF, Charcoal #1C1C1E
const colorMap: Record<TileColor, { iconBg: string; iconFg: string; ctaBg: string; ctaFg: string }> = {
  purple:  { iconBg: "#E5F1FF", iconFg: "#1F86FF", ctaBg: "#E5F1FF", ctaFg: "#1F86FF" },
  red:     { iconBg: "#FDE3E1", iconFg: "#E63329", ctaBg: "#FDE3E1", ctaFg: "#E63329" },
  blue:    { iconBg: "#E5F1FF", iconFg: "#1F86FF", ctaBg: "#E5F1FF", ctaFg: "#1F86FF" },
  emerald: { iconBg: "#EAF3FF", iconFg: "#0066E0", ctaBg: "#EAF3FF", ctaFg: "#0066E0" },
  amber:   { iconBg: "#E4E4E6", iconFg: "#1C1C1E", ctaBg: "#E4E4E6", ctaFg: "#1C1C1E" },
  indigo:  { iconBg: "#E5F1FF", iconFg: "#1F86FF", ctaBg: "#E5F1FF", ctaFg: "#1F86FF" },
};

interface BestMateTileProps {
  icon: LucideIcon;
  iconColor?: TileColor;
  value: ReactNode;
  label: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * "Best Mate" style tile — large white rounded card with big bold value,
 * label, subtitle and a tinted pill CTA at the bottom.
 * Designed for 2-up grid on mobile.
 */
export function BestMateTile({
  icon: Icon,
  iconColor = "purple",
  value,
  label,
  subtitle,
  ctaLabel,
  onCtaClick,
  onClick,
  className,
}: BestMateTileProps) {
  const c = colorMap[iconColor];

  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex flex-col bg-white rounded-2xl shadow-lift p-2.5 min-h-[85px]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Top row: icon + value + chevron */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.iconBg }}
          >
            <Icon size={15} strokeWidth={2.25} color={c.iconFg} />
          </div>
          <div className="text-lg font-bold text-zinc-900 leading-none tracking-tight">
            {value}
          </div>
        </div>
        <ChevronRight size={14} className="text-zinc-400 shrink-0" />
      </div>

      {/* Label + subtitle */}
      <div className="mt-1.5 flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-zinc-900 leading-tight truncate">{label}</div>
        {subtitle && (
          <div className="text-[10px] text-zinc-500 leading-snug truncate">{subtitle}</div>
        )}
      </div>

    </motion.div>
  );
}
