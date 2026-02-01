import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, MessageSquare, ChevronDown, ChevronUp, Clock, Users } from "lucide-react";
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

export function GapFillerCard({
  gaps,
  className = "",
}: GapFillerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const handleToggle = () => {
    haptics.selection();
    setIsExpanded(!isExpanded);
  };

  const handleDateToggle = (date: string) => {
    haptics.light();
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleSMS = (pupil: SuggestedPupil, formattedDate: string) => {
    if (!pupil.phone) return;
    haptics.light();
    const message = encodeURIComponent(
      `Hi ${pupil.name.split(" ")[0]}, I have availability on ${formattedDate}. Would you like to book a lesson?`
    );
    window.open(`sms:${pupil.phone}?body=${message}`, "_self");
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
                                Quick message these pupils:
                              </p>
                              {gap.suggestedPupils.map((pupil) => (
                                <div
                                  key={pupil.id}
                                  className="flex items-center justify-between bg-background rounded-lg p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                      {pupil.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {pupil.name}
                                      </p>
                                      {pupil.isWaitlisted && (
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                          Waitlisted
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {pupil.phone && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSMS(pupil, formattedDate);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
