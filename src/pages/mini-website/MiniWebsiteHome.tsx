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
      {/* Hero with Background Image & Postcode Search */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: primaryColor }} />
          )}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: heroOverlayColor, opacity: heroOverlayOpacity }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Rating */}
            {avgRating && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-amber-400" />
                  ))}
                </div>
                <span className="text-white text-sm font-medium">{avgRating} • {reviews.length} reviews</span>
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
              {page.hero_heading || `${instructor.business_name || instructor.name}`}
            </h1>

            <p className="text-white/90 text-lg sm:text-xl mb-10 max-w-xl mx-auto drop-shadow">
              {page.hero_subheading || "Professional driving instruction tailored to your needs"}
            </p>

            {/* Postcode Search Box */}
            <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-lg mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (postcode.trim()) {
                    window.location.href = `/book/${instructor.id}?postcode=${encodeURIComponent(postcode.trim())}`;
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your postcode to get started..."
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 text-base border-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </form>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {instructor.hourly_rate && (
                <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 px-4 py-2 text-sm">
                  £{instructor.hourly_rate}/hr
                </Badge>
              )}
              {instructor.instructor_grade && (
                <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 px-4 py-2 text-sm">
                  <Award className="h-3.5 w-3.5 mr-1" /> Grade {instructor.instructor_grade}
                </Badge>
              )}
              {instructor.car_type && (
                <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 px-4 py-2 text-sm">
                  {instructor.car_type}
                </Badge>
              )}
              {instructor.phone && (
                <a href={`tel:${instructor.phone}`}>
                  <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 px-4 py-2 text-sm cursor-pointer hover:bg-white/25 transition-colors">
                    <Phone className="h-3.5 w-3.5 mr-1" /> {instructor.phone}
                  </Badge>
                </a>
              )}
            </div>
          </motion.div>
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
