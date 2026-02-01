import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, ChevronDown, ChevronUp, Clock, Users, Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { haptics } from "@/lib/haptics";

interface SuggestedPupil {
  id: string;
  name: string;
  phone: string | null;
  postcode?: string | null;
  isWaitlisted: boolean;
}

interface GapSuggestion {
  date: string;
  durationMinutes: number;
  suggestedPupils: SuggestedPupil[];
}

interface GapFillerCardProps {
  gaps: GapSuggestion[];
  className?: string;
}

interface SelectedPupil extends SuggestedPupil {
  formattedDate: string;
}

export function GapFillerCard({
  gaps,
  className = "",
}: GapFillerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedPupils, setSelectedPupils] = useState<Map<string, SelectedPupil>>(new Map());
  const [showPreview, setShowPreview] = useState(false);

  const handleToggle = () => {
    haptics.selection();
    setIsExpanded(!isExpanded);
  };

  const handleDateToggle = (date: string) => {
    haptics.light();
    setExpandedDate(expandedDate === date ? null : date);
  };

  const togglePupilSelection = (pupil: SuggestedPupil, formattedDate: string) => {
    if (!pupil.phone) return;
    haptics.light();
    
    setSelectedPupils(prev => {
      const newMap = new Map(prev);
      const key = `${pupil.id}-${formattedDate}`;
      
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, { ...pupil, formattedDate });
      }
      return newMap;
    });
  };

  const isPupilSelected = (pupilId: string, formattedDate: string) => {
    return selectedPupils.has(`${pupilId}-${formattedDate}`);
  };

  const generateMessage = (pupil: SelectedPupil) => {
    return `Hi ${pupil.name.split(" ")[0]}, I have availability on ${pupil.formattedDate}. Would you like to book a lesson?`;
  };

  const handleSendMessages = () => {
    haptics.medium();
    
    // Send SMS to each selected pupil
    const pupils = Array.from(selectedPupils.values());
    pupils.forEach((pupil, index) => {
      if (pupil.phone) {
        const message = encodeURIComponent(generateMessage(pupil));
        // Small delay between opening each SMS to prevent issues
        setTimeout(() => {
          window.open(`sms:${pupil.phone}?body=${message}`, "_self");
        }, index * 100);
      }
    });
    
    // Clear selection after sending
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

  if (gaps.length === 0) return null;

  const totalHours = gaps.reduce((acc, gap) => acc + Math.round(gap.durationMinutes / 60), 0);
  const totalPupils = gaps[0]?.suggestedPupils?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 rounded-xl border border-amber-500/20 overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={handleToggle}
          className="w-full p-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <CalendarPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">Fill Your Gaps</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{totalHours}h available
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {gaps.length} {gaps.length === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              {totalPupils} pupils
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

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
              <div className="px-3 pb-3 space-y-2">
                {gaps.map((gap) => {
                  const formattedDate = format(parseISO(gap.date), "EEE d MMM");
                  const hoursAvailable = Math.round(gap.durationMinutes / 60);
                  const isDateExpanded = expandedDate === gap.date;

                  return (
                    <div
                      key={gap.date}
                      className="bg-background/60 rounded-lg overflow-hidden"
                    >
                      {/* Date header */}
                      <button
                        onClick={() => handleDateToggle(gap.date)}
                        className="w-full p-2 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {formattedDate}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ~{hoursAvailable}h free
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {gap.suggestedPupils.length} suggestions
                          </span>
                          {isDateExpanded ? (
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Pupils for this date */}
                      <AnimatePresence>
                        {isDateExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-2 pb-2 space-y-1.5">
                              <p className="text-xs text-muted-foreground px-1">
                                Tap to select pupils to message:
                              </p>
                              {gap.suggestedPupils.map((pupil) => {
                                const isSelected = isPupilSelected(pupil.id, formattedDate);
                                return (
                                  <button
                                    key={pupil.id}
                                    onClick={() => togglePupilSelection(pupil, formattedDate)}
                                    disabled={!pupil.phone}
                                    className={`w-full flex items-center justify-between rounded-lg p-2 transition-colors ${
                                      isSelected 
                                        ? "bg-emerald-500/20 border border-emerald-500/40" 
                                        : "bg-background hover:bg-muted"
                                    } ${!pupil.phone ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        isSelected 
                                          ? "bg-emerald-500 text-white" 
                                          : "bg-primary/10 text-primary"
                                      }`}>
                                        {isSelected ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          pupil.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                                        )}
                                      </div>
                                      <div className="min-w-0 text-left">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {pupil.name}
                                        </p>
                                        {pupil.isWaitlisted && (
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
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
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Send button */}
                {selectedPupils.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <Button
                      onClick={handleShowPreview}
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                      Preview Message ({selectedPupils.size} {selectedPupils.size === 1 ? "pupil" : "pupils"})
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
                  <button
                    onClick={handleCancelPreview}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {Array.from(selectedPupils.values()).map((pupil) => (
                    <div key={`${pupil.id}-${pupil.formattedDate}`} className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {pupil.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelPreview}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
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
