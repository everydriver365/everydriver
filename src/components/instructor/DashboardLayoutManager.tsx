import { Plus, Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt, Navigation, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { useInstructorHomepageContent, QuickAction } from "@/hooks/useInstructorHomepageContent";
import { cn } from "@/lib/utils";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Users,
  Briefcase,
  CreditCard,
  Clock,
  Settings,
  Car,
  Receipt,
  Navigation,
  Award
};

interface DashboardLayoutManagerProps {
  instructorId: string;
}

export function DashboardLayoutManager({ instructorId }: DashboardLayoutManagerProps) {
  const { getHiddenTiles, getOrderedTiles, showTile, saving, loading } = useInstructorTilePreferences(instructorId);
  const { content, loading: contentLoading } = useInstructorHomepageContent();

  const hiddenTiles = getHiddenTiles(content?.quick_actions || []);
  const visibleTiles = getOrderedTiles(content?.quick_actions || []);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Calendar;
  };

  if (loading || contentLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage which tiles appear on your dashboard home screen. You can also hide tiles by tapping Edit on the home screen and clicking the X button.
      </p>

      {/* Visible tiles summary */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-sm font-medium text-primary">
          {visibleTiles.length} tile{visibleTiles.length !== 1 ? 's' : ''} visible on home
        </p>
      </div>

      {/* Hidden tiles */}
      {hiddenTiles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            All tiles are visible on your dashboard
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            To hide a tile, tap Edit on the home screen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Hidden Tiles ({hiddenTiles.length})
          </p>
          <div className="space-y-2">
            {hiddenTiles.map(tile => {
              const Icon = getIcon(tile.icon);
              return (
                <div
                  key={tile.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{tile.title}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showTile(tile.id)}
                    disabled={saving}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add to Home
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
