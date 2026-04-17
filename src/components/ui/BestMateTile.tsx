import { ReactNode } from "react";
import { LucideIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TileColor = "purple" | "red" | "blue" | "emerald" | "amber" | "indigo";

const colorMap: Record<TileColor, { iconBg: string; iconFg: string; ctaBg: string; ctaFg: string }> = {
  purple:  { iconBg: "#EDE9FE", iconFg: "#5B21B6", ctaBg: "#EDE9FE", ctaFg: "#5B21B6" },
  red:     { iconBg: "#FEE2E2", iconFg: "#B91C1C", ctaBg: "#FEE2E2", ctaFg: "#B91C1C" },
  blue:    { iconBg: "#DBEAFE", iconFg: "#1D4ED8", ctaBg: "#DBEAFE", ctaFg: "#1D4ED8" },
  emerald: { iconBg: "#D1FAE5", iconFg: "#047857", ctaBg: "#D1FAE5", ctaFg: "#047857" },
  amber:   { iconBg: "#FEF3C7", iconFg: "#92400E", ctaBg: "#FEF3C7", ctaFg: "#92400E" },
  indigo:  { iconBg: "#E0E7FF", iconFg: "#3730A3", ctaBg: "#E0E7FF", ctaFg: "#3730A3" },
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
        "flex flex-col bg-white rounded-2xl shadow-lift p-3 min-h-[130px]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Top row: icon + chevron */}
      <div className="flex items-start justify-between mb-2">
        <div
          className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.iconBg }}
        >
          <Icon size={15} strokeWidth={2.25} color={c.iconFg} />
        </div>
        <ChevronRight size={14} className="text-zinc-400 mt-0.5" />
      </div>

      {/* Value + label */}
      <div className="flex-1">
        <div className="text-lg font-bold text-zinc-900 leading-tight tracking-tight">
          {value}
        </div>
        <div className="text-xs font-semibold text-zinc-900 mt-0.5">{label}</div>
        {subtitle && (
          <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{subtitle}</div>
        )}
      </div>

      {/* CTA */}
      {ctaLabel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCtaClick?.();
          }}
          className="mt-2 w-full rounded-lg py-1.5 text-[10px] font-bold tracking-wider uppercase transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: c.ctaBg, color: c.ctaFg }}
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );
}
