import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IOSPageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared wrapper that applies iOS-native font stack and consistent spacing
 * to instructor portal page content.
 */
export function IOSPageWrapper({ children, className }: IOSPageWrapperProps) {
  return (
    <div
      className={cn("space-y-4 pb-24", className)}
      style={{ fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}

interface IOSPageTitleProps {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Compact iOS-style inline page title with optional icon roundel.
 */
export function IOSPageTitle({ icon, iconBg, title, subtitle, action }: IOSPageTitleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className={cn("h-[29px] w-[29px] rounded-[7px] flex items-center justify-center", iconBg || "bg-primary/10")}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface IOSSectionHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * iOS Settings-style uppercase section header.
 */
export function IOSSectionHeader({ children, className }: IOSSectionHeaderProps) {
  return (
    <p className={cn("text-[13px] font-normal text-muted-foreground uppercase tracking-wide px-4 pb-1.5", className)}>
      {children}
    </p>
  );
}
