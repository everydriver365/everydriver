import { useState } from "react";
import { motion, Reorder, AnimatePresence, PanInfo } from "framer-motion";
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/calendar-icon.png";
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
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  Clock, 
  Settings,
  Car,
  Receipt,
  Navigation,
  Award,
  ChevronRight,
  GripVertical,
  Check,
  MapPin,
  MessageSquare,
  X,
  Plus,
  Heart,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAction } from "@/hooks/useInstructorHomepageContent";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { usePendingJobsPreview } from "@/hooks/usePendingJobsPreview";
import { useQuickTileActions } from "@/hooks/useQuickTileActions";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useVisitorChatUnreadCount } from "@/hooks/useVisitorChatUnreadCount";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { QuickActionsPopoverMenu } from "@/components/instructor/QuickActionsPopoverMenu";
import { InstructorTile, InstructorTileGrid, type TileCategory } from "@/components/instructor/InstructorTile";

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
  Award,
  MapPin,
  MessageSquare,
  Heart,
  Fuel: Car,
  ListTodo,
};

// Custom image icons for specific tiles (iOS-style)
const customIconImages: Record<string, string> = {
  messages: messagesIcon,
  "take-payment": takePaymentIcon,
  "payments": paymentsIcon,
  schedule: scheduleIcon,
  pupils: pupilsIcon,
  "track-lesson": trackIcon,
  satnav: satnavIcon,
  "find-my-car": findMyCarIcon,
  "jobs": jobOffersIcon,
  "availability": availabilityIcon,
  "health-hub": healthHubIcon,
  "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon,
  "expenses": expensesIcon,
  "todos": todoIcon,
  "settings": settingsIcon,
};

// Tiles with custom icon border-radius (inline style to override global !important)
const customIconRadius: Record<string, string> = {
  "find-my-car": "7px",
  "jobs": "7px",
  "take-payment": "7px",
  "payments": "7px",
  "availability": "7px",
  "health-hub": "7px",
  "find-fuel": "7px",
  "vehicle-health": "7px",
  "expenses": "7px",
  "todos": "7px",
  "settings": "7px",
};

// Tiles with larger icon size
const largeIconTiles = new Set(["jobs", "find-fuel", "vehicle-health", "schedule"]);

// Additional tiles available to add (only tiles NOT in the main quick_actions from DB)
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
  { id: "pipeline", title: "Pipeline", icon: "Briefcase", route: "/instructor/pipeline", display_order: 113 },
  { id: "automations", title: "Automations", icon: "Zap", route: "/instructor/automations", display_order: 114 },
  { id: "find-nearby", title: "Find Nearby", icon: "MapPin", route: "/instructor/find-nearby", display_order: 115 },
];

interface QuickActionTilesProps {
  quickActions: QuickAction[];
  pendingJobsCount: number;
  instructorId: string | undefined;
  loading?: boolean;
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
}

export function QuickActionTiles({
  quickActions,
  pendingJobsCount,
  instructorId,
  loading = false,
  isEditMode: externalEditMode,
  onEditModeChange
}: QuickActionTilesProps) {
  const navigate = useNavigate();
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [quickActionsMenuOpen, setQuickActionsMenuOpen] = useState(false);
  const isEditMode = externalEditMode ?? internalEditMode;
  const [swipedTileId, setSwipedTileId] = useState<string | null>(null);
  const { getOrderedTiles, getHiddenTiles, saveTileOrder, hideTile, showTile, saving } = useInstructorTilePreferences(instructorId);
  const { data: jobPreview } = usePendingJobsPreview(instructorId);
  const { nextPupil, lastContactedPupil } = useQuickTileActions(instructorId);
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: nextLessonDetails } = useNextLessonDetails(instructorId);
  const { data: messagesUnreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const { data: visitorChatUnreadCount = 0 } = useVisitorChatUnreadCount(instructorId);
  // Tiles shown separately under Today's Overview — exclude from Quick Access
  const excludedTileIds = new Set(["jobs", "messages"]);

  // Get tiles in user's preferred order (from DB tiles, with additionalTiles for lookup)
  const orderedTiles = getOrderedTiles(quickActions, additionalTiles).filter(t => !excludedTileIds.has(t.id));
  
  // Available tiles to add = additional tiles not in orderedTiles + hidden DB tiles
  const hiddenDbTiles = getHiddenTiles(quickActions);
  const availableTilesToAdd = [
    ...hiddenDbTiles,
    ...additionalTiles.filter(tile => !orderedTiles.some(t => t.id === tile.id))
  ];
  
  const [localTiles, setLocalTiles] = useState<QuickAction[]>(orderedTiles);

  // Sync local tiles when ordered tiles change (on initial load)
  const [prevOrderedTiles, setPrevOrderedTiles] = useState<string>("");
  const orderedTilesKey = orderedTiles.map(t => t.id).join(",");
  if (orderedTilesKey !== prevOrderedTiles && !isEditMode) {
    setLocalTiles(orderedTiles);
    setPrevOrderedTiles(orderedTilesKey);
  }

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Calendar;
    return Icon;
  };

  const renderTileIcon = (action: QuickAction, sizeClass: string) => {
    const customImg = customIconImages[action.id];
    if (customImg) {
      return <img src={customImg} alt={action.title} className={`${sizeClass} object-cover`} />;
    }
    const Icon = getIcon(action.icon);
    const style = tileStyles[0]; // fallback, caller should pass correct style
    return <Icon className={sizeClass} />;
  };

  const isJobOffersAction = (action: QuickAction) => {
    return action.route === "/instructor/jobs" || 
           action.title.toLowerCase().includes("job");
  };

  const isScheduleAction = (action: QuickAction) => {
    return action.route === "/instructor/schedule" || 
           action.title.toLowerCase().includes("schedule");
  };

  const isPupilsAction = (action: QuickAction) => {
    return action.route === "/instructor/pupils" || 
           action.title.toLowerCase().includes("pupil");
  };

  const isMessagesAction = (action: QuickAction) => {
    return action.route === "/instructor/messages" || 
           action.title.toLowerCase().includes("message");
  };

  const isVisitorChatsAction = (action: QuickAction) => {
    return action.route === "/instructor/visitor-chats" || 
           action.title.toLowerCase().includes("visitor");
  };

  // Only show badges on schedule, pupils, and todos
  const shouldShowBadge = (action: QuickAction): boolean => {
    return isScheduleAction(action) || isPupilsAction(action) || action.id === "todos";
  };

  const getBadgeCount = (action: QuickAction): number => {
    if (isScheduleAction(action) && todayOverview) return todayOverview.lessonCount;
    if (isPupilsAction(action) && todayOverview) return todayOverview.lessonCount;
    // todos count could be added later
    return 0;
  };

  const setEditMode = (value: boolean) => {
    if (onEditModeChange) {
      onEditModeChange(value);
    } else {
      setInternalEditMode(value);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Save changes
      const newOrder = localTiles.map(tile => tile.id);
      saveTileOrder(newOrder);
    }
    setEditMode(!isEditMode);
  };

  const handleReorder = (newOrder: QuickAction[]) => {
    setLocalTiles(newOrder);
  };

  const handleHideTile = async (tileId: string) => {
    // Optimistically update local state
    setLocalTiles(prev => prev.filter(t => t.id !== tileId));
    // Persist to database
    await hideTile(tileId);
  };

  const handleRestoreTile = async (tile: QuickAction) => {
    // Optimistically update local state - add to end
    setLocalTiles(prev => [...prev, tile]);
    // Persist to database
    await showTile(tile.id);
  };

  // Swipe action handlers
  const handleSwipeAction = (action: QuickAction) => {
    if (isScheduleAction(action) && nextPupil?.postcode) {
      // Open maps with postcode
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextPupil.postcode)}`;
      window.open(mapsUrl, '_blank');
    } else if (isPupilsAction(action) && lastContactedPupil) {
      // Navigate to messages with pupil
      navigate(`/instructor/messages?pupil=${lastContactedPupil.pupilId}`);
    }
    setSwipedTileId(null);
  };

  const handlePanEnd = (action: QuickAction, info: PanInfo) => {
    if (info.offset.x > 80) {
      handleSwipeAction(action);
    }
    setSwipedTileId(null);
  };

  // Get swipe hint for tile
  const getSwipeHint = (action: QuickAction) => {
    if (isScheduleAction(action) && nextPupil) {
      return { icon: MapPin, text: `Navigate to ${nextPupil.pupilName}` };
    }
    if (isPupilsAction(action) && lastContactedPupil) {
      return { icon: MessageSquare, text: `Message ${lastContactedPupil.pupilName}` };
    }
    return null;
  };

  // Subtitle helper
  const getSubtitle = (action: QuickAction): string | null => {
    if (isJobOffersAction(action)) return "Browse available positions";
    if (isMessagesAction(action)) return "Chat with pupils & parents";
    if (action.id === "test-requests" || action.title.toLowerCase().includes("test")) return "Pending booking requests";
    if (isScheduleAction(action)) return "View your day";
    if (isPupilsAction(action)) return "Manage your learners";
    if (action.id === "track-lesson") return "Log a lesson";
    if (action.id === "take-payment") return "Collect payment";
    if (action.id === "satnav") return "Navigate to pupil";
    if (action.id === "availability") return "Manage your hours";
    if (action.id === "find-my-car") return "Locate your vehicle";
    if (action.id === "payments") return "View transactions";
    if (action.id === "settings") return "App preferences";
    if (action.id === "health-hub") return "Wellbeing resources";
    if (action.id === "find-fuel") return "Nearest stations";
    if (action.id === "find-nearby") return "Toilets, food & more";
    if (action.id === "vehicle-health") return "Vehicle checks";
    if (action.id === "expenses") return "Track spending";
    if (action.id === "todos") return "Your task list";
    return null;
  };

  // Quick action route for green plus button
  const getQuickActionRoute = (action: QuickAction): string | null => {
    if (isScheduleAction(action)) return "/instructor/schedule?action=add";
    if (isPupilsAction(action)) return "/instructor/pupils?action=add";
    if (isMessagesAction(action)) return "/instructor/messages?action=new";
    if (action.id === "take-payment") return "/instructor/take-payment";
    if (action.id === "expenses") return "/instructor/expenses?action=add";
    if (action.id === "todos") return "/instructor/todos?action=add";
    if (action.id === "track-lesson") return "/instructor/tracking";
    if (action.id === "availability") return "/instructor/availability?action=add";
    if (action.id === "test-results") return "/instructor/test-results?action=add";
    if (action.id === "cpd-log") return "/instructor/cpd?action=add";
    if (action.id === "fill-gaps") return "/instructor/gaps?action=add";
    if (action.id === "referrals") return "/instructor/referrals?action=invite";
    return null;
  };

  // Category mapping for unified InstructorTile
  const getTileCategory = (action: QuickAction): TileCategory => {
    const id = action.id;
    if (id === "track-lesson" || id === "find-my-car" || id === "satnav" || id === "find-nearby" || id === "locations") return "location";
    if (id === "schedule" || id === "fill-gaps" || id === "availability" || id === "test-requests" || id === "test-results") return "schedule";
    if (id === "cpd-log" || id === "tests") return "education";
    if (id === "pupils" || id === "referrals" || id === "messages") return "people";
    if (id === "take-payment" || id === "payments" || id === "expenses" || isJobOffersAction(action)) return "money";
    if (id === "vehicle-health" || id === "find-fuel" || id === "health-hub") return "location";
    if (id === "todos" || id === "settings") return "settings";
    if (id === "pipeline" || id === "automations") return "insights";
    return "settings";
  };

  const STROKE: Record<string, string> = {
    schedule: "#185FA5", planning: "#042C53", people: "#2C2C2A",
    money: "#185FA5", messages: "#2C2C2A", urgent: "#A32D2D", neutral: "#5F5E5A",
  };

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid #D3D1C7", borderRadius: 12, height: 88, opacity: 0.6 }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (localTiles.length === 0 && availableTilesToAdd.length === 0) return null;

  // Different accent colors for visual variety
  const tileStyles = [
     { bg: 'bg-card', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
     { bg: 'bg-card', iconBg: 'bg-amber-500/12', iconColor: 'text-amber-600' },
     { bg: 'bg-card', iconBg: 'bg-emerald-500/12', iconColor: 'text-emerald-600' },
     { bg: 'bg-card', iconBg: 'bg-sky-500/12', iconColor: 'text-sky-600' },
     { bg: 'bg-card', iconBg: 'bg-rose-500/12', iconColor: 'text-rose-600' },
     { bg: 'bg-card', iconBg: 'bg-violet-500/12', iconColor: 'text-violet-600' },
  ];

  // Border colors removed - using standard border only

  return (
    <div className="space-y-3">
      {/* Header with Done button only shown in edit mode */}
      {isEditMode && (
        <div className="flex items-center justify-end px-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={handleEditToggle}
            disabled={saving}
          >
            <Check className="h-3.5 w-3.5" />
            Done
          </Button>
        </div>
      )}

      {isEditMode ? (
        // Edit mode with drag-and-drop
        <>
          <Reorder.Group 
            axis="y" 
            values={localTiles} 
            onReorder={handleReorder}
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {localTiles.map((action, index) => {
                const Icon = getIcon(action.icon);
                const style = tileStyles[index % tileStyles.length];
                const badgeCount = getBadgeCount(action);
                const showBadge = badgeCount > 0;

                return (
                  <Reorder.Item
                    key={action.id}
                    value={action}
                    className="touch-none"
                    layout
                  >
                    <motion.div
                      className={cn(
                        "relative overflow-hidden backdrop-blur-md rounded-2xl border-2 border-dashed border-primary/30 p-3 flex items-center gap-3 shadow-md cursor-grab active:cursor-grabbing",
                        style.bg
                      )}
                      whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                    >
                      {/* Hide button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHideTile(action.id);
                        }}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md z-10 hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className={`relative w-10 h-10 rounded-2xl ${customIconImages[action.id] ? '' : style.iconBg} flex items-center justify-center shrink-0 overflow-hidden`} style={customIconRadius[action.id] ? { borderRadius: customIconRadius[action.id] } : undefined}>
                        {customIconImages[action.id] ? <img src={customIconImages[action.id]} alt={action.title} className="w-full h-full object-cover" style={customIconRadius[action.id] ? { borderRadius: customIconRadius[action.id] } : undefined} /> : <Icon className={`h-5 w-5 ${style.iconColor}`} />}
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-foreground text-base flex-1">{action.title}</span>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
          
          {/* Available tiles section - show in edit mode */}
          {availableTilesToAdd.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Add Tiles ({availableTilesToAdd.length})
              </p>
              <div className="space-y-2">
                {availableTilesToAdd.map((tile) => {
                  const Icon = getIcon(tile.icon);
                  return (
                    <motion.div
                      key={tile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-2xl border border-dashed border-muted-foreground/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-2xl ${customIconImages[tile.id] ? '' : 'bg-primary/10'} flex items-center justify-center overflow-hidden`} style={customIconRadius[tile.id] ? { borderRadius: customIconRadius[tile.id] } : undefined}>
                          {customIconImages[tile.id] ? <img src={customIconImages[tile.id]} alt={tile.title} className="w-full h-full object-cover" style={customIconRadius[tile.id] ? { borderRadius: customIconRadius[tile.id] } : undefined} /> : <Icon className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{tile.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => handleRestoreTile(tile)}
                        disabled={saving}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        // Normal view mode — unified InstructorTile system
        <InstructorTileGrid padded={false}>
          {localTiles.map((action) => {
            const Icon = getIcon(action.icon);
            const badgeCount = getBadgeCount(action);
            const showBadge = shouldShowBadge(action) && badgeCount > 0;
            const subtitle = getSubtitle(action);
            const isLive = action.id === "track-lesson";

            const sentenceTitle =
              action.title.charAt(0).toUpperCase() +
              action.title.slice(1).toLowerCase().replace(/\bsatnav\b/i, "Sat nav");

            return (
              <InstructorTile
                key={action.id}
                icon={Icon as unknown as import("lucide-react").LucideIcon}
                title={sentenceTitle}
                category={getTileCategory(action)}
                onPress={() => navigate(action.route)}
                count={showBadge ? (badgeCount > 9 ? "9+" : badgeCount) : undefined}
                subtitle={subtitle ?? undefined}
                liveDot={isLive}
              />
            );
          })}
        </InstructorTileGrid>
      )}

      <QuickActionsPopoverMenu
        open={quickActionsMenuOpen}
        onClose={() => setQuickActionsMenuOpen(false)}
      />
    </div>
  );
}
