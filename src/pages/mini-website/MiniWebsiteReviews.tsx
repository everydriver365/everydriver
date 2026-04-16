import { useParams, Link } from "react-router-dom";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useHomepageTestimonials } from "@/hooks/useHomepageTestimonials";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Car } from "lucide-react";
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
  const links = useMiniWebsiteLinks(slug);
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "reviews");
  const { testimonials: homepageTestimonials } = useHomepageTestimonials();
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
      <div className="min-h-screen p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Link to={`/i/${slug}`}>
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const STYLE_OVERRIDES: Record<string, { primaryColor?: string }> = {
    "ken-d": { primaryColor: "#142040" },
  };
  const primaryColor = STYLE_OVERRIDES[slug]?.primaryColor || instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = (instructor.website_heading_color === "#ffffff" || instructor.website_heading_color === "#FFFFFF") ? undefined : instructor.website_heading_color;
  const textColor = (instructor.website_text_color === "#ffffff" || instructor.website_text_color === "#FFFFFF") ? undefined : instructor.website_text_color;

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Reviews" pageDescription={`Read student reviews for ${instructor.business_name || instructor.name}. See what learners say about their driving lessons.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Hero */}
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
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
        ) : null}

        {/* Testimonials */}
        {homepageTestimonials.filter(t => !t.is_featured).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: primaryColor }}>What Others Say</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {homepageTestimonials.filter(t => !t.is_featured).slice(0, 6).map((testimonial, i) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3">"{testimonial.content}"</p>
                  <div className="flex items-center gap-2 mt-3">
                    <PupilAvatar name={testimonial.name} size="xs" />
                    <div>
                      <p className="text-xs font-semibold">{testimonial.name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-6">
          <Link to={links.contact}>
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
