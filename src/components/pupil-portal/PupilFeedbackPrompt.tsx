import { useState, useEffect } from "react";
import { Star, Send, Loader2, ExternalLink } from "lucide-react";
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
  const [submitted, setSubmitted] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

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

  // Fetch instructor's Google review URL
  useEffect(() => {
    if (!pending) return;
    const fetchReviewUrl = async () => {
      const { data } = await supabase
        .from("instructors")
        .select("google_review_url" as any)
        .eq("id", pending.instructor_id)
        .single();
      if ((data as any)?.google_review_url) setGoogleReviewUrl((data as any).google_review_url);
    };
    fetchReviewUrl();
  }, [pending]);

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
      if (rating >= 4 && googleReviewUrl) {
        setSubmitted(true);
      } else {
        setPending(null);
      }
    } catch (e) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !pending) return null;

  // Show Google Review prompt after high rating
  if (submitted && googleReviewUrl) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <CardContent className="p-4 space-y-3 text-center">
          <p className="text-sm font-medium text-foreground">Thanks for the great feedback! ⭐</p>
          <p className="text-xs text-muted-foreground">
            Would you mind leaving a quick Google review? It really helps!
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => window.open(googleReviewUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Leave a Review
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPending(null)}
            >
              Maybe later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
