import { useState } from "react";
import { Star, Zap, Users, Building2, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlanSlug = "free" | "pro" | "max" | "multi" | "enterprise";

interface PlanBadgeProps {
  planSlug?: string | null;
  size?: "sm" | "md";
  className?: string;
  showUpgrade?: boolean;
  onUpgradeClick?: () => void;
}

const planConfig: Record<PlanSlug, {
  label: string;
  icon: typeof Star;
  colors: string;
  glowColors?: string;
}> = {
  free: {
    label: "Free",
    icon: Star,
    colors: "border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-400",
    glowColors: "shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  },
  pro: {
    label: "Pro",
    icon: Star,
    colors: "border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-300",
    glowColors: "shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  },
  max: {
    label: "Max",
    icon: Zap,
    colors: "border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-teal-400/15 text-emerald-300",
    glowColors: "shadow-[0_0_10px_rgba(52,211,153,0.35)]",
  },
  multi: {
    label: "Multi",
    icon: Users,
    colors: "border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-teal-400/15 text-emerald-300",
    glowColors: "shadow-[0_0_10px_rgba(52,211,153,0.35)]",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    colors: "border-emerald-300/60 bg-gradient-to-r from-emerald-500/30 to-teal-400/20 text-emerald-200",
    glowColors: "shadow-[0_0_12px_rgba(52,211,153,0.4)]",
  },
};

export function PlanBadge({ planSlug, size = "sm", className, showUpgrade, onUpgradeClick }: PlanBadgeProps) {
  const slug = (planSlug || "free") as PlanSlug;
  const config = planConfig[slug] || planConfig.free;
  const Icon = config.icon;
  const isUpgradeable = slug === "free" || slug === "pro";

  return (
    <button
      onClick={onUpgradeClick}
      className={cn(
        "group relative inline-flex items-center transition-all duration-200",
        onUpgradeClick && "cursor-pointer hover:scale-105 active:scale-95",
        !onUpgradeClick && "cursor-default"
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          config.colors,
          config.glowColors,
          "font-semibold tracking-wide transition-all duration-200",
          size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1",
          onUpgradeClick && "group-hover:brightness-125",
          className
        )}
      >
        <Icon className={cn(
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
        )} />
        {config.label}
        {showUpgrade && isUpgradeable && (
          <ArrowUp className="h-2.5 w-2.5 ml-0.5 animate-bounce" />
        )}
      </Badge>
    </button>
  );
}
