import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Users, Check, Send, X, Zap, ArrowRight } from "lucide-react";
import fillGapsIcon from "@/assets/fill-gaps-icon.png";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <div className={className}>
       <div className="p-4" style={{ backgroundColor: '#FFFFFF', borderRadius: 14, boxShadow: '0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)' }}>
        <div className="flex items-center gap-3">
           <Skeleton className="w-12 h-12 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
             <Skeleton className="h-5 w-28 bg-gray-200" />
             <Skeleton className="h-3 w-40 bg-gray-200" />
          </div>
           <Skeleton className="h-9 w-9 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function GapFillerCard({ gaps, className = "", isLoading = false }: GapFillerCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
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
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slot.id)) {
        newSet.delete(slot.id);
      } else {
        newSet.add(slot.id);
      }
      return newSet;
    });
  };

  const isSlotSelected = (slotId: string) => selectedSlots.has(slotId);

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
      return format(date, "EEE d");
    } catch {
      return firstGap.formattedDate;
    }
  };

  // Get urgency styling
  const getUrgencyStyle = () => {
    if (!firstGap) return { bg: "bg-muted", text: "text-muted-foreground" };
    try {
      const date = parseISO(firstGap.date);
      if (isToday(date)) return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" };
      if (isTomorrow(date)) return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" };
      return { bg: "bg-primary/10", text: "text-primary" };
    } catch {
      return { bg: "bg-muted", text: "text-muted-foreground" };
    }
  };

  const urgencyStyle = getUrgencyStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
       <div className="overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderRadius: 14, boxShadow: '0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)' }}>
        {/* Compact Header */}
        <button
          onClick={handleToggle}
          className="w-full p-4 flex items-center gap-3 text-left active:bg-muted/50 transition-colors"
        >
          {/* Tinted icon pill */}
          <div className="h-8 w-8 rounded-2xl overflow-hidden shrink-0">
            <img src={fillGapsIcon} alt="Fill Gaps" className="w-full h-full object-cover" />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Fill Gaps</span>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                urgencyStyle.bg,
                urgencyStyle.text
              )}>
                {getUrgencyLabel()}
              </span>
              {hasUrgentGaps && (
                <span className="w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-destructive-foreground">{totalSlots}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalSlots} {totalSlots === 1 ? "slot" : "slots"} • {totalPupils} pupils ready
            </p>
          </div>

          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Quick preview when collapsed */}
        <AnimatePresence>
          {!isExpanded && firstSlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 -mt-1"
            >
              <button
                onClick={handleViewAll}
                className="w-full flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/15 hover:to-purple-500/15 rounded-2xl px-4 py-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-foreground">
                    Next gap: {getUrgencyLabel()} at {firstSlot.startTime}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="px-4 pb-4 space-y-3">
                {gaps.map((gap) => (
                  <div key={gap.date} className="rounded-2xl p-3.5" style={{ backgroundColor: '#D1E4FC' }}>
                    {/* Date header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">
                        {gap.formattedDate}
                      </span>
                      <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                        {gap.slots.length} {gap.slots.length === 1 ? "slot" : "slots"}
                      </span>
                    </div>

                    {/* Time slots - 2 per row */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {gap.slots.map((slot) => {
                        const isSelected = isSlotSelected(slot.id);
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "px-3 py-2.5 rounded-2xl text-sm font-medium transition-all text-center",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                            )}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pupils for selected slots */}
                    <AnimatePresence>
                      {gap.slots.some((s) => isSlotSelected(s.id)) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 pt-3 border-t border-border/50"
                        >
                          <p className="text-xs text-muted-foreground font-medium">
                            Select pupils to message for {selectedSlots.size} slot{selectedSlots.size > 1 ? 's' : ''}:
                          </p>
                          <div className="grid gap-2">
                            {gap.suggestedPupils.map((pupil) => {
                              // Check if pupil is selected for any of the selected slots
                              const selectedSlotsForGap = gap.slots.filter(s => isSlotSelected(s.id));
                              const isAnySelected = selectedSlotsForGap.some(slot => 
                                isPupilSelected(pupil.id, slot.id)
                              );
                              return (
                                <button
                                  key={pupil.id}
                                  onClick={() => {
                                    // Toggle pupil for all selected slots
                                    selectedSlotsForGap.forEach(slot => {
                                      togglePupilSelection(pupil, slot, gap.formattedDate);
                                    });
                                  }}
                                  disabled={!pupil.phone}
                                  className={cn(
                                    "w-full flex items-center gap-3 rounded-2xl p-3 transition-all overflow-hidden",
                                    isAnySelected
                                      ? "bg-primary text-primary-foreground shadow-md"
                                      : "bg-card border border-border hover:border-primary/50",
                                    !pupil.phone && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                                      isAnySelected
                                        ? "bg-primary-foreground/20 text-primary-foreground"
                                        : "bg-primary/10 text-primary"
                                    )}
                                  >
                                    {isAnySelected ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      pupil.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className={cn(
                                      "text-sm font-medium truncate",
                                      isAnySelected ? "text-primary-foreground" : "text-foreground"
                                    )}>
                                      {pupil.name}
                                    </p>
                                    {pupil.isWaitlisted && (
                                      <span className={cn(
                                        "text-[10px] font-medium",
                                        isAnySelected ? "text-primary-foreground/80" : "text-primary"
                                      )}>
                                        On waitlist
                                      </span>
                                    )}
                                    {!pupil.phone && (
                                      <span className="text-[10px] text-muted-foreground">
                                        No phone
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleViewAll}
                    className="flex-1"
                  >
                    View All Gaps
                  </Button>
                  {selectedPupils.size > 0 && (
                    <Button
                      onClick={handleShowPreview}
                      className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Send className="h-4 w-4" />
                      Send ({selectedPupils.size})
                    </Button>
                  )}
                </div>
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
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
              onClick={handleCancelPreview}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-card rounded-2xl p-5 pb-safe shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle bar */}
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold">Message Preview</h3>
                  <button 
                    onClick={handleCancelPreview} 
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {Array.from(selectedPupils.values()).map((pupil) => (
                    <div key={`${pupil.id}-${pupil.slot.id}`} className="bg-muted/50 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                          {pupil.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{pupil.name}</p>
                          <p className="text-xs text-muted-foreground">{pupil.phone}</p>
                        </div>
                      </div>
                      <div className="bg-card rounded-2xl p-3 border border-border text-sm text-foreground leading-relaxed">
                        {generateMessage(pupil)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-5">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-2xl" 
                    onClick={handleCancelPreview}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-2xl gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                    onClick={handleSendMessages}
                  >
                    <Send className="h-4 w-4" />
                    Send {selectedPupils.size === 1 ? "Message" : `${selectedPupils.size} Messages`}
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
