import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionPanelProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  headerGradient?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function SectionPanel({
  title,
  icon,
  badge,
  defaultOpen = false,
  collapsible = true,
  headerGradient = false,
  children,
  className,
  headerClassName,
}: SectionPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => collapsible && setOpen(!open)}
        disabled={!collapsible}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          collapsible && "hover:bg-muted/30 cursor-pointer",
          !collapsible && "cursor-default",
          headerGradient && "bg-gradient-to-r from-primary/5 to-transparent",
          headerClassName
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          {badge}
        </div>
        {collapsible && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Content */}
      {(!collapsible || open) && (
        <div className="border-t border-border px-4 py-4">{children}</div>
      )}
    </div>
  );
}

// Group variant — wraps multiple collapsible sections in one card
interface SectionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionGroup({ children, className }: SectionGroupProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden divide-y divide-border", className)}>
      {children}
    </div>
  );
}

interface SectionGroupItemProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionGroupItem({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: SectionGroupItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
