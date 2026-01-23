import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CompetencySectionProps {
  title: string;
  number?: string;
  children: ReactNode;
  className?: string;
}

export function CompetencySection({
  title,
  number,
  children,
  className,
}: CompetencySectionProps) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <div className="bg-muted/50 px-3 py-1.5 border-b border-border">
        <h4 className="text-xs font-semibold text-foreground">
          {number && <span className="text-primary mr-1">{number}</span>}
          {title}
        </h4>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

export function SectionHeader() {
  return (
    <div className="grid grid-cols-[1fr_50px_32px_32px] gap-1 items-center py-1 px-2 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
      <span></span>
      <span className="text-center">Total</span>
      <span className="text-center text-destructive">S</span>
      <span className="text-center text-destructive">D</span>
    </div>
  );
}
