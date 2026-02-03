import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  compact = false,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-12 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          compact ? "w-12 h-12" : "w-16 h-16"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            compact ? "h-6 w-6" : "h-8 w-8",
            iconClassName
          )}
        />
      </div>
      
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>
      
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-sm",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
      
      {(actionLabel || secondaryActionLabel) && (
        <div className={cn("flex gap-2 flex-wrap justify-center", compact ? "mt-3" : "mt-4")}>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size={compact ? "sm" : "default"}
              className="gap-1.5"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              size={compact ? "sm" : "default"}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
