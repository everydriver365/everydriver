import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  course_hours: number;
  review_date: string | null;
  is_verified: boolean | null;
}

interface MiniWebsiteReviewsProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteReviews({ subdomainSlug }: MiniWebsiteReviewsProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "reviews");
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (instructor?.id) {
      supabase
        .from("course_reviews")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("moderation_status", "approved")
        .order("review_date", { ascending: false })
        .then(({ data }) => {
          if (data) setReviews(data);
        });
    }
  }, [instructor?.id]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const primaryColor = instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = instructor.website_heading_color;
  const textColor = instructor.website_text_color;

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Hero */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {page.hero_heading || "Student Reviews"}
            </h1>
            <p className="text-lg text-white/90 mb-4">{page.hero_subheading}</p>
            {avgRating && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`}
                      style={{ color: i < Math.round(Number(avgRating)) ? secondaryColor : "rgba(255,255,255,0.3)" }}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold">{avgRating}</span>
                <span className="text-white/70">({reviews.length} reviews)</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {/* Dynamic Content */}
        <PageContentRenderer
          blocks={page.content_blocks}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          headingColor={headingColor}
          textColor={textColor}
        />

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card style={{ backgroundColor: "#e9f4f9" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.reviewer_name}</span>
                          {review.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-current" : ""}`}
                              style={{
                                color: i < review.rating ? secondaryColor : "#e5e7eb",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.course_hours}h course
                      </span>
                    </div>
                    <p className="text-gray-600">{review.review_text}</p>
                    {review.review_date && (
                      <p className="text-sm text-gray-400 mt-3">
                        {new Date(review.review_date).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card style={{ backgroundColor: "#e9f4f9" }}>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center pt-6">
          <Link to={`/book/${instructor.id}`}>
            <Button size="lg" style={{ backgroundColor: primaryColor }} className="text-white">
              <Calendar className="h-5 w-5 mr-2" />
              Book Your Lesson Today
            </Button>
          </Link>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
