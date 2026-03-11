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
      {/* Cinematic Full-Width Hero */}
      <section className="relative min-h-[650px] flex items-center" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 50%, ${primaryColor}40 0%, transparent 70%)` }} />

        {heroImageUrl && (
          <div className="absolute inset-0">
            <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0" style={{ backgroundColor: heroOverlayColor, opacity: heroOverlayOpacity }} />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 relative z-10 py-16">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Rating pill */}
                {avgRating && (
                  <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current text-amber-400" />
                      ))}
                    </div>
                    <span className="text-white/70 text-sm">{avgRating} • {reviews.length} reviews</span>
                  </div>
                )}

                <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] mb-6 tracking-tight">
                  {page.hero_heading ? (
                    <span>{page.hero_heading}</span>
                  ) : (
                    <>
                      LEARN TO<br />
                      <span
                        className="bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}
                      >
                        DRIVE WITH
                      </span><br />
                      CONFIDENCE
                    </>
                  )}
                </h1>

                <p className="text-white/60 text-lg mb-8 max-w-lg">
                  {page.hero_subheading || instructor.bio}
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link to={`/book/${instructor.id}`}>
                    <Button size="lg" className="rounded-full px-10 text-lg font-bold shadow-2xl text-white" style={{ backgroundColor: primaryColor }}>
                      <Calendar className="h-5 w-5 mr-2" /> Book Your Lesson
                    </Button>
                  </Link>
                  {instructor.phone && (
                    <a href={`tel:${instructor.phone}`}>
                      <Button size="lg" variant="ghost" className="rounded-full text-white hover:bg-white/10">
                        <Phone className="h-5 w-5 mr-2" /> Call Now
                      </Button>
                    </a>
                  )}
                </div>

                <div className="flex gap-8">
                  {instructor.hourly_rate && (
                    <div>
                      <div className="text-2xl font-black text-white">£{instructor.hourly_rate}</div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">Hourly Rate</div>
                    </div>
                  )}
                  {instructor.instructor_grade && (
                    <div>
                      <div className="text-2xl font-black text-white">{instructor.instructor_grade}</div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">Grade</div>
                    </div>
                  )}
                  {instructor.car_type && (
                    <div>
                      <div className="text-2xl font-black text-white">{instructor.car_type}</div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">Transmission</div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2 flex justify-center">
              {instructor.profile_image_url && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                  <div className="w-72 h-72 rounded-full overflow-hidden ring-4 ring-white/20">
                    <img src={instructor.profile_image_url} alt={instructor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-2 shadow-xl">
                    <span className="font-bold text-sm">{instructor.name}</span>
                  </div>
                </motion.div>
              )}
            </div>
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
