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
