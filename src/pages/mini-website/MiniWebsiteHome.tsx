import { useParams, Link, useNavigate } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Star, Award, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import earlyTestBadge from "@/assets/earlier-test-guaranteed-badge.png";

interface MiniWebsiteHomeProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteHome({ subdomainSlug }: MiniWebsiteHomeProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  // Use subdomain slug if provided, otherwise use URL param
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "home");
  const links = useMiniWebsiteLinks(slug);
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    if (instructor?.id) {
      // Fetch reviews and courses
      Promise.all([
        supabase
          .from("course_reviews")
          .select("rating")
          .eq("instructor_id", instructor.id)
          .eq("moderation_status", "approved"),
        supabase
          .from("instructor_courses")
          .select("*")
          .eq("instructor_id", instructor.id)
          .eq("is_active", true)
          .limit(3),
      ]).then(([reviewsRes, coursesRes]) => {
        if (reviewsRes.data) setReviews(reviewsRes.data);
        if (coursesRes.data) setCourses(coursesRes.data);
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find this instructor's website.
          </p>
          <Link to="/">
            <Button>Find Instructors</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const primaryColor = instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = instructor.website_heading_color;
  const textColor = instructor.website_text_color;
  // Use instructor's hero_image_url (from admin editor) or fallback to page's hero_image_url
  const heroImageUrl = instructor.hero_image_url || page.hero_image_url;
  const heroOverlayColor = instructor.hero_overlay_color || "#000000";
  const heroOverlayOpacity = instructor.hero_overlay_opacity ?? 0.2;

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* V12H: Dark Bottom Panel Hero */}
      <section>
        <div className="relative h-[400px]">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: primaryColor }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        </div>
        <div className="bg-gray-900 px-4 pb-6 -mt-1">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3">
                <img src={earlyTestBadge} alt="Earlier Test Guaranteed" className="w-40 h-40 object-contain shrink-0" />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (postcode.trim()) {
                      window.location.href = `/book/${instructor.id}?postcode=${encodeURIComponent(postcode.trim())}`;
                    }
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter your postcode..."
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="pl-10 h-12 text-base rounded-xl bg-white border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 px-6 rounded-xl text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <PageContentRenderer
          blocks={page.content_blocks}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          headingColor={headingColor}
          textColor={textColor}
        />

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {[
            { to: links.about, label: "About Me", sub: "Learn more" },
            { to: links.services, label: "Services", sub: "View options" },
            { to: links.courses, label: "Courses", sub: "Search & book" },
            { to: links.reviews, label: "Reviews", sub: `${reviews.length} reviews` },
            { to: links.contact, label: "Contact", sub: "Get in touch" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" style={{ backgroundColor: "#e9f4f9" }}>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold" style={{ color: primaryColor }}>{link.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{link.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
