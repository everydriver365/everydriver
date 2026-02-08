import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: StatCardVariant;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<StatCardVariant, { card: string; icon: string }> = {
  primary: {
    card: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    icon: "text-primary",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    card: "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800",
    icon: "text-rose-600 dark:text-rose-400",
  },
  info: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  neutral: {
    card: "bg-gradient-to-br from-muted/30 to-muted/50 border-border",
    icon: "text-muted-foreground",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = "primary",
  onClick,
  className,
  children,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "border rounded-xl p-4 text-left transition-all",
        styles.card,
        onClick && "hover:shadow-md hover:scale-[1.01] cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", styles.icon)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      )}
      {children}
    </Component>
  );
}
