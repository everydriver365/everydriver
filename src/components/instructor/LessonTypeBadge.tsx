import { Badge } from "@/components/ui/badge";
import { Car, GraduationCap, RefreshCw, Clock, Target } from "lucide-react";

type LessonType = "standard" | "intensive" | "test-prep" | "refresher" | "first";

interface LessonTypeBadgeProps {
  type: LessonType;
  size?: "sm" | "md";
  className?: string;
}

const lessonTypeConfig: Record<LessonType, { 
  label: string; 
  icon: typeof Car;
  colors: string;
}> = {
  standard: {
    label: "Standard",
    icon: Car,
    colors: "border-primary/30 bg-primary/10 text-primary",
  },
  intensive: {
    label: "Intensive",
    icon: Target,
    colors: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  "test-prep": {
    label: "Test Prep",
    icon: GraduationCap,
    colors: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  refresher: {
    label: "Refresher",
    icon: RefreshCw,
    colors: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  first: {
    label: "First Lesson",
    icon: Clock,
    colors: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

export function LessonTypeBadge({
  type,
  size = "sm",
  className = "",
}: LessonTypeBadgeProps) {
  const config = lessonTypeConfig[type] || lessonTypeConfig.standard;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.colors} ${
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      } ${className}`}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
      {config.label}
    </Badge>
  );
}
