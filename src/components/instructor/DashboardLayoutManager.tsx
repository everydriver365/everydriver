import { Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt, Navigation, Award, Loader2 } from "lucide-react";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { useInstructorHomepageContent, QuickAction } from "@/hooks/useInstructorHomepageContent";
import { cn } from "@/lib/utils";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt, Navigation, Award,
};

interface DashboardLayoutManagerProps {
  instructorId: string;
}

export function DashboardLayoutManager({ instructorId }: DashboardLayoutManagerProps) {
  const { getHiddenTiles, getOrderedTiles, hideTile, showTile, saving, loading } = useInstructorTilePreferences(instructorId);
  const { content, loading: contentLoading } = useInstructorHomepageContent();

  const allTiles = content?.quick_actions || [];
  const hiddenTiles = getHiddenTiles(allTiles);
  const hiddenIds = new Set(hiddenTiles.map((t) => t.id));

  const getIcon = (iconName: string) => iconMap[iconName] || Calendar;

  if (loading || contentLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allTiles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No tiles available yet.
      </p>
    );
  }

  const visibleCount = allTiles.length - hiddenIds.size;

  const handleToggle = (tile: QuickAction) => {
    if (hiddenIds.has(tile.id)) {
      showTile(tile.id);
    } else {
      hideTile(tile.id);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose which tiles appear on your home screen.
      </p>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-sm font-medium text-primary">
          {visibleCount} of {allTiles.length} tile{allTiles.length !== 1 ? "s" : ""} visible
        </p>
      </div>

      {/* Full tile list with checkboxes */}
      <div className="space-y-1.5">
        {allTiles
          .sort((a, b) => a.display_order - b.display_order)
          .map((tile) => {
            const Icon = getIcon(tile.icon);
            const isVisible = !hiddenIds.has(tile.id);

            return (
              <button
                key={tile.id}
                onClick={() => handleToggle(tile)}
                disabled={saving}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  isVisible
                    ? "bg-card border-primary/20 shadow-[0_1px_4px_rgba(20,37,66,0.06)]"
                    : "bg-muted/30 border-border/50 opacity-70"
                )}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                    isVisible
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40 bg-transparent"
                  )}
                >
                  {isVisible && (
                    <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  isVisible ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn("h-4.5 w-4.5", isVisible ? "text-primary" : "text-muted-foreground")} />
                </div>

                {/* Label */}
                <span className={cn(
                  "text-sm font-medium",
                  isVisible ? "text-foreground" : "text-muted-foreground"
                )}>
                  {tile.title}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
