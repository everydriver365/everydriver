import { Star, Zap, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlanSlug = "free" | "pro" | "max" | "multi" | "enterprise";

interface PlanBadgeProps {
  planSlug?: string | null;
  size?: "sm" | "md";
  className?: string;
}

const planConfig: Record<PlanSlug, {
  label: string;
  icon: typeof Star;
  colors: string;
}> = {
  free: {
    label: "Free",
    icon: Star,
    colors: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  pro: {
    label: "Pro",
    icon: Star,
    colors: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  max: {
    label: "Max",
    icon: Zap,
    colors: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  multi: {
    label: "Multi",
    icon: Users,
    colors: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    colors: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export function PlanBadge({ planSlug, size = "sm", className }: PlanBadgeProps) {
  const slug = (planSlug || "free") as PlanSlug;
  const config = planConfig[slug] || planConfig.free;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.colors,
        size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "text-xs px-2 py-0.5 gap-1",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {config.label}
    </Badge>
  );
}
