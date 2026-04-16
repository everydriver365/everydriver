import { useState, useEffect } from "react";
import { Star, ChevronRight, ChevronLeft, Send, Loader2, ExternalLink, Smile, Meh, Frown, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface PupilEndOfLessonWizardProps {
  pupilId: string;
  instructorId: string;
  brandColour?: string | null;
}

interface PendingFeedback {
  id: string;
  lesson_history_id: string | null;
  instructor_id: string;
}

type Mood = "confident" | "okay" | "struggled";

const MOODS: { value: Mood; icon: typeof Smile; label: string; color: string }[] = [
  { value: "confident", icon: Smile, label: "Confident", color: "text-emerald-500" },
  { value: "okay", icon: Meh, label: "Okay", color: "text-amber-500" },
  { value: "struggled", icon: Frown, label: "Struggled", color: "text-red-400" },
];

export function PupilEndOfLessonWizard({ pupilId, instructorId, brandColour }: PupilEndOfLessonWizardProps) {
  const [pending, setPending] = useState<PendingFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Step 1 — rating
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [mood, setMood] = useState<Mood | null>(null);

  // Step 2 — reflect
  const [whatWentWell, setWhatWentWell] = useState("");
  const [improvements, setImprovements] = useState("");
  const [nextGoals, setNextGoals] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, [pupilId]);

  const fetchPending = async () => {
    try {
      const { data } = await supabase
        .from("lesson_feedback")
        .select("id, lesson_history_id, instructor_id")
        .eq("pupil_id", pupilId)
        .is("responded_at", null)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setPending(data as PendingFeedback);
        // Fetch Google review URL
        const { data: inst } = await supabase
          .from("instructors")
          .select("google_review_url" as any)
          .eq("id", data.instructor_id)
          .single();
        if ((inst as any)?.google_review_url) {
          setGoogleReviewUrl((inst as any).google_review_url);
        }
      }
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!pending || rating === 0) return;
    setSubmitting(true);

    try {
      // Build a comment from mood + free text
      const moodLabel = mood ? `Feeling: ${mood}` : "";
      const comment = moodLabel;

      // Update lesson_feedback with rating
      await supabase
        .from("lesson_feedback")
        .update({
          rating,
          comment: comment || null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", pending.id);

      // Insert reflective log if any text was provided
      if (whatWentWell.trim() || improvements.trim() || nextGoals.trim()) {
        await supabase.from("reflective_logs").insert({
          pupil_id: pupilId,
          lesson_history_id: pending.lesson_history_id,
          what_went_well: whatWentWell.trim() || null,
          improvements: improvements.trim() || null,
          next_goals: nextGoals.trim() || null,
        });
      }

      toast.success("Thanks for reflecting on your lesson! 🎉");
      setStep(2); // go to done step
    } catch (e) {
      toast.error("Failed to submit — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPending(null);
  };

  if (loading || !pending) return null;

  const accentStyle = brandColour ? { backgroundColor: brandColour } : undefined;
  const accentClass = brandColour ? "" : "bg-primary";

  return (
    <>
      {/* Trigger card on home screen */}
      {!open && (
        <Card
          className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setOpen(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${accentClass}`}
              style={accentStyle}
            >
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">How did your lesson go?</p>
              <p className="text-xs text-muted-foreground">Take a minute to rate &amp; reflect</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* Wizard drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">
              {step === 0 && "Rate Your Lesson"}
              {step === 1 && "Reflect & Grow"}
              {step === 2 && "All Done!"}
            </DrawerTitle>
            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mt-2">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? "w-8" : "w-4"
                  } ${s <= step ? accentClass : "bg-muted"}`}
                  style={s <= step ? accentStyle : undefined}
                />
              ))}
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* STEP 0: Rating */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-5"
                >
                  <p className="text-sm text-muted-foreground text-center">
                    How would you rate today's lesson?
                  </p>

                  {/* Stars */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-9 w-9 transition-colors ${
                            (hoverRating || rating) >= s
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/25"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Mood */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">How are you feeling?</p>
                    <div className="flex justify-center gap-3">
                      {MOODS.map((m) => {
                        const Icon = m.icon;
                        const isActive = mood === m.value;
                        return (
                          <button
                            key={m.value}
                            onClick={() => setMood(m.value)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                              isActive
                                ? "border-primary bg-primary/10 scale-105"
                                : "border-transparent hover:bg-muted"
                            }`}
                          >
                            <Icon className={`h-7 w-7 ${m.color}`} />
                            <span className="text-[11px] font-medium text-foreground">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className={`w-full ${accentClass}`}
                    style={accentStyle}
                    disabled={rating === 0}
                    onClick={() => setStep(1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {/* STEP 1: Reflect */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground text-center">
                    Take a moment to reflect — this helps you improve faster!
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        What went well?
                      </label>
                      <Textarea
                        placeholder="e.g. Mirror checks were great, felt calm at roundabouts..."
                        value={whatWentWell}
                        onChange={(e) => setWhatWentWell(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        What was tricky?
                      </label>
                      <Textarea
                        placeholder="e.g. Parallel parking was tough, need more practice..."
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Goal for next time
                      </label>
                      <Textarea
                        placeholder="e.g. Focus on bay parking, be smoother with gear changes..."
                        value={nextGoals}
                        onChange={(e) => setNextGoals(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      className={`flex-1 ${accentClass}`}
                      style={accentStyle}
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Submit
                    </Button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-xs text-muted-foreground underline w-full text-center"
                  >
                    Skip reflection &amp; just submit rating
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Done */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Thanks for reflecting! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your feedback helps you and your instructor track your progress.
                    </p>
                  </div>

                  {rating >= 4 && googleReviewUrl && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Loved your lesson? Help others find a great instructor!
                      </p>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => window.open(googleReviewUrl, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Leave a Google Review
                      </Button>
                    </div>
                  )}

                  <Button variant="outline" onClick={handleClose} className="w-full">
                    Close
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
