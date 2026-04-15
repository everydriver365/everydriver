import { Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt, Navigation, Award, Loader2, MapPin, MessageSquare, Heart, ListTodo, FileBarChart, BarChart3, ClipboardCheck } from "lucide-react";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { useInstructorHomepageContent, QuickAction } from "@/hooks/useInstructorHomepageContent";
import { cn } from "@/lib/utils";

// Same icon imports as QuickActionTiles
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import satnavIcon from "@/assets/satnav-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import availabilityIcon from "@/assets/availability-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import findFuelIcon from "@/assets/find-fuel-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import monthEndIcon from "@/assets/month-end-icon.png";
import weeklyReportIcon from "@/assets/weekly-report-icon.png";
import tasksDueIcon from "@/assets/tasks-due-icon.png";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt, Navigation, Award, MapPin, MessageSquare, Heart, Fuel: Car, ListTodo, FileBarChart, BarChart3, ClipboardCheck,
};

const customIconImages: Record<string, string> = {
  messages: messagesIcon,
  "take-payment": takePaymentIcon,
  payments: paymentsIcon,
  schedule: scheduleIcon,
  pupils: pupilsIcon,
  "track-lesson": trackIcon,
  satnav: satnavIcon,
  "find-my-car": findMyCarIcon,
  jobs: jobOffersIcon,
  availability: availabilityIcon,
  "health-hub": healthHubIcon,
  "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon,
  expenses: expensesIcon,
  todos: todoIcon,
  settings: settingsIcon,
  "month-end": monthEndIcon,
  "weekly-report": weeklyReportIcon,
  "tasks-due": tasksDueIcon,
};

const customIconRadius: Record<string, string> = {
  "find-my-car": "7px",
  jobs: "7px",
  "take-payment": "7px",
  payments: "7px",
  availability: "7px",
  "health-hub": "7px",
  "find-fuel": "7px",
  "vehicle-health": "7px",
  expenses: "7px",
  todos: "7px",
  settings: "7px",
};

// Same additional tiles as QuickActionTiles
const additionalTiles: QuickAction[] = [
  { id: "fill-gaps", title: "Fill Gaps", icon: "Calendar", route: "/instructor/gaps", display_order: 98 },
  { id: "todos", title: "To Do", icon: "ListTodo", route: "/instructor/todos", display_order: 99 },
  { id: "vehicle-health", title: "Vehicle Health", icon: "Car", route: "/instructor/vehicle-health", display_order: 100 },
  { id: "find-fuel", title: "Find Fuel", icon: "Fuel", route: "/instructor/fuel", display_order: 100.5 },
  { id: "test-results", title: "Log Test Result", icon: "Award", route: "/instructor/test-results", display_order: 101 },
  { id: "test-requests", title: "Test Swap", icon: "Award", route: "/instructor/test-requests", display_order: 101.5 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 102 },
  { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations", display_order: 103 },
  { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd", display_order: 104 },
  { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings", display_order: 105 },
  { id: "referrals", title: "Referrals", icon: "Users", route: "/instructor/referrals", display_order: 106 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 106 },
  { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses", display_order: 107 },
  { id: "nearby-adis", title: "Nearby ADIs", icon: "Users", route: "/instructor/nearby-friends", display_order: 108 },
  { id: "find-colleague", title: "Find Colleague", icon: "Users", route: "/instructor/fleet-map?mode=colleagues", display_order: 109 },
  { id: "month-end", title: "Month End", icon: "FileBarChart", route: "/instructor/month-end", display_order: 109 },
  { id: "weekly-report", title: "Weekly Report", icon: "BarChart3", route: "/instructor/weekly-report", display_order: 110 },
  { id: "tasks-due", title: "Tasks Due", icon: "ClipboardCheck", route: "/instructor/outstanding-tasks", display_order: 111 },
  { id: "end-of-day", title: "End of Day", icon: "Moon", route: "/instructor/end-of-day", display_order: 112 },
  { id: "pipeline", title: "Pipeline", icon: "Briefcase", route: "/instructor/pipeline", display_order: 113 },
  { id: "automations", title: "Automations", icon: "Zap", route: "/instructor/automations", display_order: 114 },
  { id: "subscriptions", title: "Subscriptions", icon: "RefreshCw", route: "/instructor/subscriptions", display_order: 115 },
];

interface DashboardLayoutManagerProps {
  instructorId: string;
}

export function DashboardLayoutManager({ instructorId }: DashboardLayoutManagerProps) {
  const { getOrderedTiles, hideTile, showTile, saving, loading, hiddenTiles } = useInstructorTilePreferences(instructorId);
  const { content, loading: contentLoading } = useInstructorHomepageContent();

  const dbTiles = content?.quick_actions || [];
  
  // Merge DB tiles + additional tiles (deduped), same as QuickActionTiles
  const allTilesMap = new Map<string, QuickAction>();
  dbTiles.forEach(t => allTilesMap.set(t.id, t));
  additionalTiles.forEach(t => { if (!allTilesMap.has(t.id)) allTilesMap.set(t.id, t); });
  const allTiles = Array.from(allTilesMap.values()).sort((a, b) => a.display_order - b.display_order);

  const hiddenSet = new Set(hiddenTiles);
  // Tiles currently visible on the homepage
  const orderedTiles = getOrderedTiles(dbTiles, additionalTiles);
  const visibleIds = new Set(orderedTiles.map(t => t.id));

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

  const visibleCount = visibleIds.size;

  const handleToggle = (tile: QuickAction) => {
    if (visibleIds.has(tile.id)) {
      hideTile(tile.id);
    } else {
      showTile(tile.id);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose which tiles appear on your home screen.
      </p>

      <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
        <p className="text-sm font-medium text-primary">
          {visibleCount} of {allTiles.length} tile{allTiles.length !== 1 ? "s" : ""} visible
        </p>
      </div>

      <div className="space-y-1.5">
        {allTiles.map((tile) => {
          const Icon = getIcon(tile.icon);
          const isVisible = visibleIds.has(tile.id);
          const customImg = customIconImages[tile.id];
          const radius = customIconRadius[tile.id];

          return (
            <button
              key={tile.id}
              onClick={() => handleToggle(tile)}
              disabled={saving}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                isVisible
                  ? "bg-card border-primary/20 shadow-[0_1px_4px_rgba(20,37,66,0.06)]"
                  : "bg-muted/30 border-border/50 opacity-70"
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  "h-5 w-5 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors",
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

              {/* Icon - using custom images when available */}
              <div
                className={cn(
                  "h-9 w-9 flex items-center justify-center shrink-0 overflow-hidden",
                  !customImg && (isVisible ? "bg-primary/10" : "bg-muted"),
                  customImg ? "rounded-2xl" : "rounded-2xl"
                )}
                style={radius ? { borderRadius: radius } : undefined}
              >
                {customImg ? (
                  <img
                    src={customImg}
                    alt={tile.title}
                    className="w-full h-full object-cover"
                    style={radius ? { borderRadius: radius } : undefined}
                  />
                ) : (
                  <Icon className={cn("h-4.5 w-4.5", isVisible ? "text-primary" : "text-muted-foreground")} />
                )}
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
