import { useParams, Link, useNavigate } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Star, Award, MapPin, Search, CheckCircle, Gift, BookOpen, Shield, CreditCard, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import earlyTestBadge from "@/assets/earlier-test-guaranteed-badge.png";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.webp";

interface MiniWebsiteHomeProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteHome({ subdomainSlug }: MiniWebsiteHomeProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "home");
  const links = useMiniWebsiteLinks(slug);
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    if (instructor?.id) {
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
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
  const instructorName = instructor.business_name || instructor.name;

  const benefits = [
    { icon: CheckCircle, title: "Free Re-Test", desc: "If you fail first time, we'll pay for your next test!" },
    { icon: BookOpen, title: "Free Theory Test", desc: "Need a theory test? We'll book it for free!" },
    { icon: Shield, title: "Earlier Test Guaranteed", desc: "We find you an earlier test date or your money back." },
    { icon: Search, title: "Free Cancellation Finder", desc: "Access to the best test finding software available." },
    { icon: CreditCard, title: "Flexible Payments", desc: "Pay over up to 8 months with Klarna or Clearpay." },
    { icon: Clock, title: "Book Early, Save More", desc: "Early bird discounts and student offers available." },
  ];

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Announcement Bar */}
      <div className="bg-[#dbe7f2] border-b border-[#c4d7e9] py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm font-medium text-black">
          <span>🌟 Special Offer: 10% off your first lesson</span>
          <span className="hidden md:inline">💳 Pay in instalments with Klarna</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <img
                src={defaultHeroImage}
                alt={instructorName}
                className="w-full h-[580px] object-cover rounded-3xl shadow-xl"
              />
              <img
                src={earlyTestBadge}
                alt="Earlier Test Guaranteed"
                className="absolute -top-4 -right-4 w-36 h-36 object-contain drop-shadow-lg"
              />
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-5"
            >
              {/* Rating */}
              {avgRating && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-5 w-5 ${
                        s <= Math.round(Number(avgRating))
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="font-bold text-muted-foreground">
                    {avgRating} ({reviews.length} reviews)
                  </span>
                </div>
              )}

              {/* Heading */}
              <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                Learn to Drive in Winchester
              </h1>

              <p className="text-muted-foreground text-lg">
                Book direct and pass, weekly or intensive driving courses in Winchester, Southampton &amp; Portsmouth
              </p>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const slug = instructor.app_slug;
                  const params = postcode.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : '';
                  window.location.href = `/i/${slug}/courses${params}`;
                }}
                }}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Your postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 rounded-full border-border shadow-sm"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 rounded-full font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Find Lessons
                </Button>
              </form>

              {/* Course Type Cards */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Link to={links.courses}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition cursor-pointer rounded-2xl">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={intensiveCourseTile}
                        alt="Intensive Courses"
                        className="w-full h-full object-cover"
                      />
                    </div>
                     <CardContent className="p-3">
                       <h3 className="font-bold text-sm text-foreground">Intensive Courses</h3>
                       <p className="text-xs text-muted-foreground">Fast-track your test</p>
                     </CardContent>
                  </Card>
                </Link>
                <Link to={links.services}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition cursor-pointer rounded-2xl">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={weeklyLessonsTile}
                        alt="Weekly Lessons"
                        className="w-full h-full object-cover"
                      />
                    </div>
                     <CardContent className="p-3">
                       <h3 className="font-bold text-sm text-foreground">Weekly Lessons</h3>
                       <p className="text-xs text-muted-foreground">At your own pace</p>
                     </CardContent>
                  </Card>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Section - Benefits Grid */}
      <section className="bg-muted/30 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-foreground mt-1">
              Why choose {instructorName}?
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Exclusive benefits you won't find anywhere else
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-background shadow-sm">
                  <benefit.icon
                    className="h-5 w-5"
                    style={{ color: primaryColor }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-1">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Stats Bar */}
      {avgRating && (
        <section className="py-8 bg-primary">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-12 text-primary-foreground">
              <div className="text-center">
                <div className="text-4xl font-black">{avgRating}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= Math.round(Number(avgRating))
                          ? "fill-primary-foreground text-primary-foreground"
                          : "text-primary-foreground/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-primary-foreground/80 mt-1">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black">{reviews.length}</div>
                <div className="text-sm text-primary-foreground/80 mt-1">Verified Reviews</div>
              </div>
              {courses.length > 0 && (
                <div className="text-center">
                  <div className="text-4xl font-black">{courses.length}</div>
                  <div className="text-sm text-primary-foreground/80 mt-1">Active Courses</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Page Content Blocks */}
      {page.content_blocks && page.content_blocks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <PageContentRenderer
            blocks={page.content_blocks}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            headingColor={headingColor}
            textColor={textColor}
          />
        </section>
      )}

      {/* Quick Links */}
      <section className="bg-secondary/50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { to: links.about, label: "About Me", sub: "Learn more" },
              { to: links.services, label: "Services", sub: "View options" },
              { to: links.courses, label: "Courses", sub: "Search & book" },
              { to: links.reviews, label: "Reviews", sub: `${reviews.length} reviews` },
              { to: links.contact, label: "Contact", sub: "Get in touch" },
            ].map((link) => (
              <Link key={link.to} to={link.to}>
                <Card className="border border-border shadow-sm hover:shadow-md transition rounded-2xl cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <h3
                      className="font-bold text-sm"
                      style={{ color: primaryColor }}
                    >
                      {link.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-primary-foreground mb-3">
            Start your driving journey today! 🚗
          </h2>
          <p className="text-primary-foreground/70 mb-6">
            Join thousands of happy learners. Pass your driving test with us!
          </p>
          <Link to={links.courses}>
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold rounded-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Search Now
            </Button>
          </Link>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
