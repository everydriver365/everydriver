import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, Loader2, Car } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  reviewer_name: z.string().min(2, "Name must be at least 2 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
  course_hours: z.number().min(1, "Please enter course hours"),
  review_text: z.string().min(10, "Review must be at least 10 characters").max(500, "Review must be under 500 characters"),
  reviewer_email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export default function SubmitReview() {
  const { slug } = useParams<{ slug: string }>();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [courseHours, setCourseHours] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [instructorName, setInstructorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  useState(() => {
    if (!slug) return;
    supabase
      .from("instructors")
      .select("id, name")
      .eq("app_slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInstructorId(data.id);
          setInstructorName(data.name);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // spam bot

    const parsed = reviewSchema.safeParse({
      reviewer_name: name,
      rating,
      course_hours: Number(courseHours),
      review_text: reviewText,
      reviewer_email: email || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.from("course_reviews").insert({
      instructor_id: instructorId!,
      reviewer_name: name,
      rating,
      course_hours: Number(courseHours),
      review_text: reviewText,
      reviewer_email: email || null,
      review_date: new Date().toISOString().split("T")[0],
      is_visible: false,
      moderation_status: "pending",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit review. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !instructorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold mb-2">Instructor Not Found</h1>
          <p className="text-muted-foreground">This review link doesn't appear to be valid.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md w-full text-center p-8">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
            <p className="text-muted-foreground">
              Your review has been submitted and will appear once approved by {instructorName}.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Leave a Review</h1>
                <p className="text-muted-foreground mt-1">
                  Share your experience with {instructorName}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Star Rating */}
                <div>
                  <Label>Rating *</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating}</p>}
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John S."
                  />
                  {errors.reviewer_name && <p className="text-sm text-destructive mt-1">{errors.reviewer_name}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  {errors.reviewer_email && <p className="text-sm text-destructive mt-1">{errors.reviewer_email}</p>}
                </div>

                {/* Course Hours */}
                <div>
                  <Label htmlFor="hours">Course Hours *</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    value={courseHours}
                    onChange={(e) => setCourseHours(e.target.value)}
                    placeholder="e.g. 30"
                  />
                  {errors.course_hours && <p className="text-sm text-destructive mt-1">{errors.course_hours}</p>}
                </div>

                {/* Review Text */}
                <div>
                  <Label htmlFor="review">Your Review *</Label>
                  <Textarea
                    id="review"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell others about your experience..."
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{reviewText.length}/500</p>
                  {errors.review_text && <p className="text-sm text-destructive mt-1">{errors.review_text}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
