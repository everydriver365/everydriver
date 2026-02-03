import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, ChevronRight, Clock, Users, Check, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface SuggestedPupil {
  id: string;
  name: string;
  phone: string | null;
  postcode?: string | null;
  isWaitlisted: boolean;
}

interface RealGapSuggestion {
  date: string;
  formattedDate: string;
  slots: GapSlot[];
  suggestedPupils: SuggestedPupil[];
}

interface GapFillerCardProps {
  gaps: RealGapSuggestion[];
  className?: string;
  isLoading?: boolean;
}

interface SelectedPupil extends SuggestedPupil {
  slot: GapSlot;
  formattedDate: string;
}

export function GapFillerCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-4 ${className}`}>
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20 p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GapFillerCard({ gaps, className = "", isLoading = false }: GapFillerCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<GapSlot | null>(null);
  const [selectedPupils, setSelectedPupils] = useState<Map<string, SelectedPupil>>(new Map());
  const [showPreview, setShowPreview] = useState(false);

  if (isLoading) {
    return <GapFillerCardSkeleton className={className} />;
  }

  const handleToggle = () => {
    haptics.selection();
    setIsExpanded(!isExpanded);
  };

  const handleSlotSelect = (slot: GapSlot) => {
    haptics.light();
    setSelectedSlot(selectedSlot?.id === slot.id ? null : slot);
  };

  const togglePupilSelection = (pupil: SuggestedPupil, slot: GapSlot, formattedDate: string) => {
    if (!pupil.phone) return;
    haptics.light();

    setSelectedPupils((prev) => {
      const newMap = new Map(prev);
      const key = `${pupil.id}-${slot.id}`;

      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, { ...pupil, slot, formattedDate });
      }
      return newMap;
    });
  };

  const isPupilSelected = (pupilId: string, slotId: string) => {
    return selectedPupils.has(`${pupilId}-${slotId}`);
  };

  const generateMessage = (pupil: SelectedPupil) => {
    return `Hi ${pupil.name.split(" ")[0]}, I have a slot available on ${pupil.formattedDate} at ${pupil.slot.startTime}. Would you like to book a lesson?`;
  };

  const handleSendMessages = () => {
    haptics.medium();

    const pupils = Array.from(selectedPupils.values());
    pupils.forEach((pupil, index) => {
      if (pupil.phone) {
        const message = encodeURIComponent(generateMessage(pupil));
        setTimeout(() => {
          window.open(`sms:${pupil.phone}?body=${message}`, "_self");
        }, index * 100);
      }
    });

    setSelectedPupils(new Map());
    setShowPreview(false);
  };

  const handleCancelPreview = () => {
    haptics.light();
    setShowPreview(false);
  };

  const handleShowPreview = () => {
    if (selectedPupils.size === 0) return;
    haptics.medium();
    setShowPreview(true);
  };

  const handleViewAll = () => {
    haptics.light();
    navigate("/instructor/gaps");
  };

  if (gaps.length === 0) return null;

  const totalSlots = gaps.reduce((acc, gap) => acc + gap.slots.length, 0);
  const totalPupils = gaps[0]?.suggestedPupils?.length || 0;
  
  // Find first available slot for display
  const firstGap = gaps[0];
  const firstSlot = firstGap?.slots[0];
  
  // Check if any gaps are urgent (today or tomorrow)
  const hasUrgentGaps = gaps.some(gap => {
    try {
      const date = parseISO(gap.date);
      return isToday(date) || isTomorrow(date);
    } catch {
      return false;
    }
  });
  
  // Get urgency label
  const getUrgencyLabel = () => {
    if (!firstGap) return "";
    try {
      const date = parseISO(firstGap.date);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      return format(date, "EEE d MMM");
    } catch {
      return firstGap.formattedDate;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/15 dark:to-purple-500/15 rounded-xl border border-violet-500/20 overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={handleToggle}
          className="w-full p-3 flex items-center gap-3 text-left"
        >
          {/* Icon with pulse for urgent gaps */}
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            {hasUrgentGaps && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse ring-2 ring-background" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">Fill Your Gaps</span>
              {hasUrgentGaps && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded-full">
                  <Sparkles className="h-2.5 w-2.5" />
                  {getUrgencyLabel()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{totalSlots} slots</span>
              <span className="text-violet-400">•</span>
              <Users className="h-3 w-3" />
              <span>{totalPupils} pupils available</span>
            </div>
          </div>

          {/* Quick action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAll();
            }}
            className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors shrink-0"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </button>

        {/* First slot quick preview */}
        {!isExpanded && firstSlot && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg px-2.5 py-2">
              <span className="text-foreground font-medium">
                {getUrgencyLabel()} {firstSlot.startTime}
              </span>
              <span className="text-violet-400">→</span>
              <span>Tap to fill</span>
            </div>
          </div>
        )}

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3">
                {gaps.map((gap) => (
                  <div key={gap.date} className="bg-background/60 rounded-lg p-3">
                    {/* Date header with slots inline */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {gap.formattedDate}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {gap.slots.length} {gap.slots.length === 1 ? "slot" : "slots"}
                      </span>
                    </div>

                    {/* Time slots - improved styling */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {gap.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                              isSelected
                                ? "bg-violet-500 text-white border-violet-600 shadow-sm"
                                : "bg-background border-border hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-foreground"
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pupils for selected slot */}
                    <AnimatePresence>
                      {selectedSlot && gap.slots.some((s) => s.id === selectedSlot.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1.5 pt-2 border-t border-border/50"
                        >
                          <p className="text-xs text-muted-foreground">
                            Offer {selectedSlot.startTime} - {selectedSlot.endTime} to:
                          </p>
                          {gap.suggestedPupils.map((pupil) => {
                            const isSelected = isPupilSelected(pupil.id, selectedSlot.id);
                            return (
                              <button
                                key={pupil.id}
                                onClick={() =>
                                  togglePupilSelection(pupil, selectedSlot, gap.formattedDate)
                                }
                                disabled={!pupil.phone}
                                className={`w-full flex items-center justify-between rounded-lg p-2.5 transition-all border ${
                                  isSelected
                                    ? "bg-violet-500/10 border-violet-500/40"
                                    : "bg-background border-transparent hover:bg-muted"
                                } ${!pupil.phone ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                                      isSelected
                                        ? "bg-violet-500 text-white"
                                        : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      pupil.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                    )}
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {pupil.name}
                                    </p>
                                    {pupil.isWaitlisted && (
                                      <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                                        Waitlisted
                                      </span>
                                    )}
                                    {!pupil.phone && (
                                      <span className="text-[10px] text-muted-foreground">
                                        No phone number
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Send button */}
                {selectedPupils.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <Button
                      onClick={handleShowPreview}
                      className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                      Preview Message ({selectedPupils.size}{" "}
                      {selectedPupils.size === 1 ? "pupil" : "pupils"})
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
              onClick={handleCancelPreview}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-background rounded-t-2xl p-4 pb-safe"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Preview Messages</h3>
                  <button onClick={handleCancelPreview} className="p-1 rounded-full hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {Array.from(selectedPupils.values()).map((pupil) => (
                    <div key={`${pupil.id}-${pupil.slot.id}`} className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-semibold text-violet-600 dark:text-violet-400">
                          {pupil.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{pupil.name}</span>
                        <span className="text-xs text-muted-foreground">• {pupil.phone}</span>
                      </div>
                      <p className="text-sm text-foreground bg-background rounded-lg p-2 border">
                        {generateMessage(pupil)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={handleCancelPreview}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={handleSendMessages}
                  >
                    <Send className="h-4 w-4" />
                    Send {selectedPupils.size} {selectedPupils.size === 1 ? "Message" : "Messages"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
