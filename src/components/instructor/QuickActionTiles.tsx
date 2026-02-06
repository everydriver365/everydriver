import { useState } from "react";
import { motion, Reorder, AnimatePresence, PanInfo } from "framer-motion";
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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAction } from "@/hooks/useInstructorHomepageContent";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { usePendingJobsPreview } from "@/hooks/usePendingJobsPreview";
import { useQuickTileActions } from "@/hooks/useQuickTileActions";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";

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
  Fuel: Car, // Reuse Car icon for Fuel until Fuel is available
};

// Additional tiles available to add (only tiles NOT in the main quick_actions from DB)
const additionalTiles: QuickAction[] = [
  { id: "vehicle-health", title: "Vehicle Health", icon: "Car", route: "/instructor/vehicle-health", display_order: 100 },
  { id: "test-results", title: "Log Test Result", icon: "Award", route: "/instructor/test-results", display_order: 101 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 102 },
  { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations", display_order: 103 },
  { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd", display_order: 104 },
  { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings", display_order: 105 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 106 },
  { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses", display_order: 107 },
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
  const isEditMode = externalEditMode ?? internalEditMode;
  const [swipedTileId, setSwipedTileId] = useState<string | null>(null);
  const { getOrderedTiles, getHiddenTiles, saveTileOrder, hideTile, showTile, saving } = useInstructorTilePreferences(instructorId);
  const { data: jobPreview } = usePendingJobsPreview(instructorId);
  const { nextPupil, lastContactedPupil } = useQuickTileActions(instructorId);
  const { data: todayOverview } = useTodayOverview(instructorId);
  
  // Get tiles in user's preferred order (from DB tiles, with additionalTiles for lookup)
  const orderedTiles = getOrderedTiles(quickActions, additionalTiles);
  
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-card rounded-xl border border-border p-4 h-16 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (localTiles.length === 0 && availableTilesToAdd.length === 0) return null;

  // Different accent colors for visual variety
  const tileStyles = [
     { bg: 'bg-white dark:bg-white', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-600' },
     { bg: 'bg-white dark:bg-white', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-600' },
     { bg: 'bg-white dark:bg-white', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-600' },
  ];

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
                const showBadge = isJobOffersAction(action) && pendingJobsCount > 0;

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
                      <div className={`relative w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${style.iconColor}`} />
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                            {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
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
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-dashed border-muted-foreground/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
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
        // Normal view mode
        <>
          {/* First tile - full width with enhanced info */}
          {localTiles[0] && (
            <motion.div
              key={localTiles[0].id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={localTiles[0].route}>
                 <div className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-lg active:shadow-md transition-all border border-border border-l-[3px] border-l-[#1877F2]">
                  <div className="flex items-center gap-4">
                    <div className={`relative w-12 h-12 rounded-xl ${tileStyles[0].iconBg} flex items-center justify-center shrink-0`}>
                      {(() => {
                        const Icon = getIcon(localTiles[0].icon);
                        const showBadge = isJobOffersAction(localTiles[0]) && pendingJobsCount > 0;
                        const isSchedule = isScheduleAction(localTiles[0]);
                        const showLessonBadge = isSchedule && todayOverview && todayOverview.lessonCount > 0;
                        return (
                          <>
                            <Icon className={`h-6 w-6 ${tileStyles[0].iconColor}`} />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-card">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                            {showLessonBadge && !showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-card">
                                {todayOverview.lessonCount}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <span className="font-semibold text-foreground text-lg">{localTiles[0].title}</span>
                       {/* Simple subtitle */}
                       <p className="text-muted-foreground text-xs mt-0.5">
                         {isScheduleAction(localTiles[0]) && todayOverview && todayOverview.lessonCount > 0
                           ? `${todayOverview.lessonCount} lesson${todayOverview.lessonCount !== 1 ? 's' : ''} today`
                           : 'Tap to view'
                         }
                       </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground relative shrink-0" />
                  </div>
                  
                  {/* Quick stats row for schedule tile */}
                  {isScheduleAction(localTiles[0]) && todayOverview && todayOverview.lessonCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{todayOverview.totalHours} hours of lessons</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-xs text-muted-foreground">£{todayOverview.expectedEarnings} expected</span>
                      </div>
                      {todayOverview.firstPickupPostcode && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Next lesson in {todayOverview.firstPickupPostcode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          )}

          {/* 2-column grid for remaining actions - compact oblong tiles */}
          <div className="grid grid-cols-2 gap-2">
            {localTiles.slice(1).map((action, index) => {
              const Icon = getIcon(action.icon);
              const showBadge = isJobOffersAction(action) && pendingJobsCount > 0;
              const style = tileStyles[(index + 1) % tileStyles.length];
              
              return (
                <Link key={action.id} to={action.route} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    whileTap={{ scale: 0.97 }}
                     className={`relative overflow-hidden ${style.bg} rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-md hover:shadow-lg active:shadow-sm transition-shadow border border-border border-l-[3px] border-l-[#1877F2]`}
                  >
                    <div className={`relative w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${style.iconColor}`} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center shadow-sm ring-1 ring-card">
                          {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-foreground text-sm leading-tight">
                      {action.title}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
