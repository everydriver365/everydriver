import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Check, X, RotateCcw, Copy, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  review_text: string;
  course_hours: number;
  review_date: string | null;
  is_verified: boolean | null;
  moderation_status: string;
  moderation_note: string | null;
  created_at: string;
}

export default function InstructorReviews() {
  const { instructor } = useInstructorAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!instructor?.id) return;
    const { data } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("instructor_id", instructor.id)
      .order("created_at", { ascending: false });
    if (data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [instructor?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("course_reviews")
      .update({
        moderation_status: status,
        is_visible: status === "approved",
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update review");
      return;
    }
    toast.success(status === "approved" ? "Review approved!" : status === "rejected" ? "Review rejected" : "Review updated");
    fetchReviews();
  };

  const pending = reviews.filter((r) => r.moderation_status === "pending");
  const approved = reviews.filter((r) => r.moderation_status === "approved");
  const rejected = reviews.filter((r) => r.moderation_status === "rejected");

  const reviewLink = instructor?.app_slug
    ? `${window.location.origin}/review/${instructor.app_slug}`
    : null;

  const copyLink = () => {
    if (reviewLink) {
      navigator.clipboard.writeText(reviewLink);
      toast.success("Review link copied!");
    }
  };

  const ReviewCard = ({ review, actions }: { review: Review; actions: React.ReactNode }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{review.reviewer_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{review.course_hours}h course</p>
            {review.review_date && <p>{new Date(review.review_date).toLocaleDateString()}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{review.review_text}</p>
        {review.reviewer_email && (
          <p className="text-xs text-muted-foreground">📧 {review.reviewer_email}</p>
        )}
        <div className="flex gap-2 pt-1">{actions}</div>
      </CardContent>
    </Card>
  );

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Manage and moderate student reviews</p>
        </div>

        {/* Shareable Link */}
        {reviewLink && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Share this link to collect reviews</p>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs truncate">
                  {reviewLink}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">
                Pending {pending.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">{pending.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1">
                Rejected ({rejected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No pending reviews</p>
              ) : (
                pending.map((review, i) => (
                  <motion.div key={review.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <ReviewCard
                      review={review}
                      actions={
                        <>
                          <Button size="sm" onClick={() => updateStatus(review.id, "approved")}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(review.id, "rejected")}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      }
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {approved.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No approved reviews yet</p>
              ) : (
                approved.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    actions={
                      <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "pending")}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Unpublish
                      </Button>
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3">
              {rejected.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No rejected reviews</p>
              ) : (
                rejected.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    actions={
                      <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "approved")}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    }
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
