import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CircleVariant = "primary" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";

interface QuickActionCircleProps {
  icon: LucideIcon;
  label: string;
  variant?: CircleVariant;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const circleStyles: Record<CircleVariant, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  neutral: "bg-muted text-muted-foreground",
};

export function QuickActionCircle({
  icon: Icon,
  label,
  variant = "primary",
  onClick,
  disabled,
  className,
}: QuickActionCircleProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40",
        className
      )}
    >
      <div className={cn("h-11 w-11 rounded-full flex items-center justify-center", circleStyles[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
