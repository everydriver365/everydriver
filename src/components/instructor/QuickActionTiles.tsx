import { useState, useCallback } from "react";
import { motion, Reorder, useDragControls, PanInfo, AnimatePresence } from "framer-motion";
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
  Pencil,
  Check,
  MapPin,
  MessageSquare,
  Timer,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAction } from "@/hooks/useInstructorHomepageContent";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { usePendingJobsPreview } from "@/hooks/usePendingJobsPreview";
import { useQuickTileActions } from "@/hooks/useQuickTileActions";
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

interface QuickActionTilesProps {
  quickActions: QuickAction[];
  pendingJobsCount: number;
  instructorId: string | undefined;
  loading?: boolean;
}

export function QuickActionTiles({
  quickActions,
  pendingJobsCount,
  instructorId,
  loading = false
}: QuickActionTilesProps) {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [swipedTileId, setSwipedTileId] = useState<string | null>(null);
  const { getOrderedTiles, saveTileOrder, hideTile, saving } = useInstructorTilePreferences(instructorId);
  const { data: jobPreview } = usePendingJobsPreview(instructorId);
  const { nextPupil, lastContactedPupil } = useQuickTileActions(instructorId);
  
  // Get tiles in user's preferred order
  const orderedTiles = getOrderedTiles(quickActions);
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

  const handleEditToggle = () => {
    if (isEditMode) {
      // Save changes
      const newOrder = localTiles.map(tile => tile.id);
      saveTileOrder(newOrder);
    }
    setIsEditMode(!isEditMode);
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

  if (localTiles.length === 0) return null;

  // Different accent colors for visual variety
  const tileStyles = [
    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-violet-500/15 dark:bg-violet-500/20', iconColor: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-blue-500/15 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-rose-500/15 dark:bg-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-3">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={handleEditToggle}
          disabled={saving}
        >
          {isEditMode ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </>
          )}
        </Button>
      </div>

      {isEditMode ? (
        // Edit mode with drag-and-drop
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
                    animate={{ 
                      rotate: [0, -0.5, 0.5, 0],
                    }}
                    transition={{ 
                      rotate: { repeat: Infinity, duration: 0.3, ease: "easeInOut" }
                    }}
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
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-foreground text-sm flex-1">{action.title}</span>
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        // Normal view mode
        <>
          {/* First tile - full width */}
          {localTiles[0] && (
            <motion.div
              key={localTiles[0].id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={localTiles[0].route}>
                <div className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 dark:border-white/10 p-4 flex items-center gap-4 shadow-lg active:shadow-md transition-all">
                  <div className={`relative w-12 h-12 rounded-xl ${tileStyles[0].iconBg} flex items-center justify-center`}>
                    {(() => {
                      const Icon = getIcon(localTiles[0].icon);
                      const showBadge = isJobOffersAction(localTiles[0]) && pendingJobsCount > 0;
                      return (
                        <>
                          <Icon className={`h-6 w-6 ${tileStyles[0].iconColor}`} />
                          {showBadge && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-card">
                              {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="relative flex-1">
                    <span className="font-semibold text-foreground text-base">{localTiles[0].title}</span>
                    <p className="text-muted-foreground text-xs mt-0.5">Tap to view</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground relative" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* 2-column grid for remaining actions */}
          <div className="grid grid-cols-2 gap-3">
            {localTiles.slice(1).map((action, index) => {
              const Icon = getIcon(action.icon);
              const showBadge = isJobOffersAction(action) && pendingJobsCount > 0;
              const style = tileStyles[(index + 1) % tileStyles.length];
              const isJobTile = isJobOffersAction(action);
              const swipeHint = getSwipeHint(action);
              const isSwiped = swipedTileId === action.id;
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="relative overflow-hidden"
                >
                  {/* Swipe action indicator behind */}
                  {swipeHint && (
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 flex items-center pl-3">
                      <swipeHint.icon className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <motion.div
                    drag={swipeHint ? "x" : false}
                    dragConstraints={{ left: 0, right: 100 }}
                    dragElastic={0.1}
                    onDragStart={() => setSwipedTileId(action.id)}
                    onDragEnd={(_, info) => handlePanEnd(action, info)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ x: 0 }}
                  >
                    <Link to={action.route}>
                      <div className={`relative overflow-hidden ${style.bg} backdrop-blur-md rounded-2xl border border-border/50 dark:border-white/10 p-4 flex flex-col gap-2 shadow-lg hover:shadow-xl active:shadow-md transition-all min-h-[120px]`}>
                        <div className={`relative w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${style.iconColor}`} />
                          {showBadge && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-md ring-2 ring-card">
                              {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-foreground text-sm leading-tight relative mt-auto">
                          {action.title}
                        </span>
                        
                        {/* Job preview text */}
                        {isJobTile && jobPreview && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground truncate">
                              {jobPreview.courseTypeShort} • {jobPreview.hours}h • £{jobPreview.estimatedPayment}
                            </span>
                            {/* Expiry timer */}
                            <span className={cn(
                              "text-[9px] font-medium flex items-center gap-0.5",
                              jobPreview.urgencyLevel === "critical" ? "text-destructive" :
                              jobPreview.urgencyLevel === "warning" ? "text-amber-600 dark:text-amber-400" :
                              "text-muted-foreground"
                            )}>
                              <Timer className="h-2.5 w-2.5" />
                              {jobPreview.expiresInHours > 0 
                                ? `Expires in ${jobPreview.expiresInHours}h`
                                : `Expires in ${jobPreview.expiresInMinutes}m`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
