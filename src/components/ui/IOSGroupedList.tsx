import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface IOSGroupedListProps {
  header?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

/**
 * iOS-style inset grouped list container (like Settings app).
 * Renders children as rows inside a rounded card with dividers.
 */
export function IOSGroupedList({ header, footer, children, className }: IOSGroupedListProps) {
  return (
    <div className={cn("", className)}>
      {header && (
        <p className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide px-4 pb-1.5">
          {header}
        </p>
      )}
      <div className="bg-card rounded-[10px] border border-border overflow-hidden">
        {React.Children.map(children, (child, index) => (
          <>
            {index > 0 && (
              <div className="ml-[52px]">
                <div className="h-px bg-border" />
              </div>
            )}
            {child}
          </>
        ))}
        {children}
      </div>
      {footer && (
        <p className="text-[13px] text-muted-foreground px-4 pt-1.5">
          {footer}
        </p>
      )}
    </div>
  );
}

interface IOSListRowProps {
  icon?: ReactNode;
  iconBg?: string;
  label: string;
  value?: string | ReactNode;
  detail?: string;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * A single row inside an IOSGroupedList.
 */
export function IOSListRow({
  icon,
  iconBg,
  label,
  value,
  detail,
  chevron = false,
  destructive = false,
  onClick,
  className,
}: IOSListRowProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        onClick && "active:bg-muted/50",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "h-[29px] w-[29px] rounded-[7px] flex items-center justify-center shrink-0",
            iconBg || "bg-muted"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className={cn("text-[15px]", destructive ? "text-destructive" : "text-foreground")}>
          {label}
        </span>
        {detail && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
      {value && (
        <span className="text-[15px] text-muted-foreground shrink-0">{value}</span>
      )}
      {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
    </Comp>
  );
}
