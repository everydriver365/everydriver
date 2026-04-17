import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, Send, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface MatchedPupil {
  id: string;
  pupil_id: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
  };
}

interface CancellationBackfillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  originalLessonId: string;
}

export function CancellationBackfillSheet({
  open,
  onOpenChange,
  instructorId,
  lessonDate,
  startTime,
  endTime,
  durationMinutes,
  originalLessonId,
}: CancellationBackfillSheetProps) {
  const [matchedPupils, setMatchedPupils] = useState<MatchedPupil[]>([]);
  const [selectedPupilIds, setSelectedPupilIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedPupilIds(new Set());

    const fetchMatches = async () => {
      // Get day of week from lessonDate
      const date = new Date(lessonDate + "T00:00:00");
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayOfWeek = days[date.getDay()];
      const hour = parseInt(startTime.split(":")[0]);
      const timeSlot = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

      const { data, error } = await supabase
        .from("lesson_waitlist")
        .select("*, pupil:pupils(id, name, phone)")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (!error && data) {
        const filtered = data.filter((entry: any) => {
          const dayMatch = !entry.preferred_days?.length || entry.preferred_days.includes(dayOfWeek);
          const timeMatch = !entry.preferred_times?.length || entry.preferred_times.includes(timeSlot);
          const durMatch = durationMinutes >= (entry.min_duration_mins || 0) && durationMinutes <= (entry.max_duration_mins || 999);
          return dayMatch && timeMatch && durMatch && entry.pupil?.phone;
        });
        setMatchedPupils(filtered as MatchedPupil[]);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [open, instructorId, lessonDate, startTime, durationMinutes]);

  const togglePupil = (pupilId: string) => {
    haptics.light();
    setSelectedPupilIds(prev => {
      const next = new Set(prev);
      next.has(pupilId) ? next.delete(pupilId) : next.add(pupilId);
      return next;
    });
  };

  const handleSendOffers = async () => {
    setSending(true);
    haptics.medium();

    const selected = matchedPupils.filter(p => selectedPupilIds.has(p.pupil_id));

    // Create slot offers
    const offers = selected.map(p => ({
      instructor_id: instructorId,
      pupil_id: p.pupil_id,
      original_lesson_id: originalLessonId,
      lesson_date: lessonDate,
      start_time: startTime,
      end_time: endTime,
      duration_mins: durationMinutes,
      instructor_approved: true,
      pupil_response: "pending",
    }));

    await supabase.from("slot_offers").insert(offers);

    // Open SMS for each pupil
    const dateObj = new Date(lessonDate + "T00:00:00");
    const formattedDate = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

    selected.forEach((p, i) => {
      const msg = encodeURIComponent(
        `Hi ${p.pupil.name.split(" ")[0]}, I have a slot available on ${formattedDate} at ${startTime}. Would you like to book a lesson?`
      );
      setTimeout(() => {
        window.open(`sms:${p.pupil.phone}?body=${msg}`, "_self");
      }, i * 100);
    });

    setSending(false);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-card rounded-2xl shadow-lift p-5 pb-safe shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Fill this slot?</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {startTime} – {endTime} • {durationMinutes}min
                </p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : matchedPupils.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No waitlisted pupils match this slot</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {matchedPupils.length} waitlisted pupil{matchedPupils.length !== 1 ? "s" : ""} match this slot
              </p>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {matchedPupils.map(p => {
                  const isSelected = selectedPupilIds.has(p.pupil_id);
                  return (
                    <button
                      key={p.pupil_id}
                      onClick={() => togglePupil(p.pupil_id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl p-3 transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/50 border border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {isSelected ? <Check className="h-4 w-4" /> : p.pupil.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn("text-sm font-medium", isSelected ? "text-primary-foreground" : "text-foreground")}>
                          {p.pupil.name}
                        </p>
                        <span className={cn("text-[10px]", isSelected ? "text-primary-foreground/80" : "text-primary")}>
                          On waitlist
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Skip
                </Button>
                <Button
                  onClick={handleSendOffers}
                  disabled={selectedPupilIds.size === 0 || sending}
                  className="flex-1 gap-2"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Offer ({selectedPupilIds.size})
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
