import { useState, useEffect } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilFeedbackPromptProps {
  pupilId: string;
}

interface FeedbackRequest {
  id: string;
  rating: number | null;
  comment: string | null;
  responded_at: string | null;
  requested_at: string;
  instructor_id: string;
}

export function PupilFeedbackPrompt({ pupilId }: PupilFeedbackPromptProps) {
  const [pending, setPending] = useState<FeedbackRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, [pupilId]);

  const fetchPending = async () => {
    try {
      const { data } = await supabase
        .from("lesson_feedback")
        .select("id, rating, comment, responded_at, requested_at, instructor_id")
        .eq("pupil_id", pupilId)
        .is("responded_at", null)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setPending(data as FeedbackRequest | null);
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
      await supabase
        .from("lesson_feedback")
        .update({
          rating,
          comment: comment.trim() || null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", pending.id);

      toast.success("Thanks for your feedback! ⭐");
      setPending(null);
    } catch (e) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !pending) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          How was your lesson?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Your feedback helps your instructor improve. Tap a star to rate your lesson.
        </p>

        {/* Star rating */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  (hoverRating || rating) >= s
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <>
            <Textarea
              placeholder="Any comments? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Submit Feedback
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
