import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatItem {
  value: number | string;
  label: string;
  color?: "default" | "success" | "warning" | "destructive" | "muted";
  highlight?: boolean;
}

interface FilterItem {
  id: string;
  label: string;
  count?: number;
  color?: string;
}

interface ArloPageLayoutProps {
  children: ReactNode;
  stats?: StatItem[];
  filters?: FilterItem[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  showFilters?: boolean;
  className?: string;
}

function getStatColor(color?: StatItem["color"]) {
  switch (color) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-600";
    case "destructive":
      return "text-destructive";
    case "muted":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function ArloPageLayout({
  children,
  stats,
  filters,
  activeFilter,
  onFilterChange,
  showFilters = true,
  className,
}: ArloPageLayoutProps) {
  const hasFilters = filters && filters.length > 0 && showFilters;

  return (
    <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
      {/* Left Sidebar - Status Filters (Desktop Only) */}
      {hasFilters && (
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange?.(filter.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                  activeFilter === filter.id
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={filter.color}>{filter.label}</span>
                {filter.count !== undefined && (
                  <span
                    className={cn(
                      "text-xs",
                      filter.color || "text-muted-foreground"
                    )}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Stats Header */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-2 md:gap-4 pb-4 border-b overflow-x-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "text-center px-3 md:px-4 shrink-0",
                  stat.highlight && "bg-destructive/10 rounded-lg py-2"
                )}
              >
                <div
                  className={cn(
                    "text-xl md:text-2xl font-bold",
                    stat.highlight ? "text-destructive" : getStatColor(stat.color)
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cn(
                    "text-[10px] md:text-xs whitespace-nowrap",
                    stat.highlight ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Filters */}
        {hasFilters && (
          <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange?.(filter.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span>{filter.label}</span>
                  {filter.count !== undefined && (
                    <span
                      className={cn(
                        "text-xs",
                        activeFilter === filter.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

// Reusable stats card component for consistent Arlo styling
interface ArloStatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  color?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export function ArloStatsCard({
  icon,
  value,
  label,
  color = "default",
  className,
}: ArloStatsCardProps) {
  const colorClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-card rounded-lg border",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold truncate">{value}</div>
        <div className="text-sm text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

// Mobile-friendly table wrapper
interface ArloTableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ArloTableWrapper({ children, className }: ArloTableWrapperProps) {
  return (
    <div className={cn("rounded-md border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
