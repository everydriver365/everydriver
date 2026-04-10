import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InstructorPageHeaderProps {
  icon?: ReactNode;
  /** Path to a custom PNG/SVG icon from src/assets */
  customIcon?: string;
  /** Lucide icon component as fallback */
  lucideIcon?: React.ElementType;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardised page header matching the homepage tile visual language:
 * - 44px rounded icon container with #E6E8EC background
 * - Consistent title/subtitle typography
 * - Optional trailing action (button, badge, etc.)
 */
export function InstructorPageHeader({
  icon,
  customIcon,
  lucideIcon: LucideIcon,
  title,
  subtitle,
  action,
  className,
}: InstructorPageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between sticky top-14 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4", className)}>
      <div className="flex items-center gap-3">
        {/* 44px icon circle */}
        <div className="h-11 w-11 rounded-full bg-[#E6E8EC] dark:bg-[#2C2C2E] flex items-center justify-center shrink-0">
          {icon ? (
            icon
          ) : customIcon ? (
            <img src={customIcon} alt="" className="h-8 w-8" />
          ) : LucideIcon ? (
            <LucideIcon className="h-6 w-6 text-foreground/70" />
          ) : null}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
