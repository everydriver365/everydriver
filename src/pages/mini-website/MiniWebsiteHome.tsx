import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Star, Award, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    if (instructor?.id) {
      // Fetch reviews and courses
      Promise.all([
        supabase
          .from("course_reviews")
          .select("rating")
          .eq("instructor_id", instructor.id)
          .eq("is_visible", true),
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

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-16 sm:py-24"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${secondaryColor} 0%, transparent 50%)`,
            }}
          />
        </div>

        {heroImageUrl && (
          <div className="absolute inset-0">
            <img
              src={heroImageUrl}
              alt="Hero"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}

        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {instructor.logo_url && (
              <img
                src={instructor.logo_url}
                alt={instructor.name}
                className="h-20 w-auto mx-auto mb-6 bg-white rounded-lg p-2"
              />
            )}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {page.hero_heading || `Welcome to ${instructor.name}`}
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              {page.hero_subheading}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {avgRating && (
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  <Star className="h-4 w-4 mr-1 fill-current" style={{ color: secondaryColor }} />
                  {avgRating} ({reviews.length} reviews)
                </Badge>
              )}
              {instructor.instructor_grade && (
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  Grade {instructor.instructor_grade}
                </Badge>
              )}
              {instructor.cpd_certified && (
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  <Award className="h-4 w-4 mr-1" /> CPD Certified
                </Badge>
              )}
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                <MapPin className="h-4 w-4 mr-1" /> {instructor.home_postcode}
              </Badge>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={`/book/${instructor.id}`}>
                <Button
                  size="lg"
                  className="text-white shadow-lg"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book a Lesson
                </Button>
              </Link>
              {instructor.phone && (
                <a href={`tel:${instructor.phone}`}>
                  <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now
                  </Button>
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

        {/* Quick links to other pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <Link to={links.about}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold" style={{ color: primaryColor }}>
                  About Me
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Learn more</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={links.services}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold" style={{ color: primaryColor }}>
                  Services
                </h3>
                <p className="text-sm text-muted-foreground mt-1">View courses</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={links.reviews}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold" style={{ color: primaryColor }}>
                  Reviews
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviews.length} reviews
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to={links.contact}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold" style={{ color: primaryColor }}>
                  Contact
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Get in touch</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
