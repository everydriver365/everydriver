import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostLessonRatingProps {
  pupilId: string;
  instructorId: string;
  brandColour: string;
}

interface UnratedLesson {
  id: string;
  lesson_date: string;
  start_time: string;
}

export function PostLessonRating({ pupilId, instructorId, brandColour }: PostLessonRatingProps) {
  const [lesson, setLesson] = useState<UnratedLesson | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchUnratedLesson();
  }, [pupilId]);

  const fetchUnratedLesson = async () => {
    const { data } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time")
      .eq("pupil_id", pupilId)
      .eq("instructor_id", instructorId)
      .eq("status", "completed")
      .lt("lesson_date", new Date().toISOString().split("T")[0])
      .order("lesson_date", { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return;

    // Check which ones already have ratings
    const lessonIds = data.map((l) => l.id);
    const { data: ratings } = await supabase
      .from("lesson_ratings")
      .select("lesson_id")
      .eq("pupil_id", pupilId)
      .in("lesson_id", lessonIds);

    const ratedIds = new Set((ratings || []).map((r) => r.lesson_id));
    const unrated = data.find((l) => !ratedIds.has(l.id));
    
    // Check if dismissed in this session
    const dismissedKey = `rating_dismissed_${unrated?.id}`;
    if (unrated && !sessionStorage.getItem(dismissedKey)) {
      setLesson(unrated);
    }
  };

  const handleSubmit = async () => {
    if (!lesson || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("lesson_ratings").insert({
      lesson_id: lesson.id,
      pupil_id: pupilId,
      instructor_id: instructorId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast.error("Failed to submit rating");
    } else {
      toast.success("Thanks for your feedback!");
    }
    setSubmitting(false);
    setLesson(null);
  };

  const handleDismiss = () => {
    if (lesson) sessionStorage.setItem(`rating_dismissed_${lesson.id}`, "1");
    setDismissed(true);
    setTimeout(() => setLesson(null), 300);
  };

  if (!lesson || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">How was your last lesson?</h3>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className="h-9 w-9"
                  style={{
                    color: star <= (hoveredStar || rating) ? brandColour : undefined,
                    fill: star <= (hoveredStar || rating) ? brandColour : "transparent",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Comment (shown after rating) */}
          <AnimatePresence>
            {rating > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Textarea
                  placeholder="Any feedback? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3 text-sm resize-none"
                  rows={2}
                  maxLength={500}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  style={{ backgroundColor: brandColour, color: "#fff" }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Sending..." : "Submit Rating"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
