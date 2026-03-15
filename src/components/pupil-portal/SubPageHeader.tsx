import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubPageHeaderProps {
  title: string;
  onBack: () => void;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable iOS-style sub-page header with back arrow, title, and optional action slot.
 */
export function SubPageHeader({ title, onBack, action, className }: SubPageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 pt-2 pb-3", className)}>
      <button
        onClick={onBack}
        className="flex items-center gap-0.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors -ml-1 shrink-0"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back</span>
      </button>
      <h2 className="flex-1 text-center text-[15px] font-semibold text-foreground truncate pr-8">
        {title}
      </h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
