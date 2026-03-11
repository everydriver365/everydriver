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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
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
  const heroImageUrl = instructor.hero_image_url || page.hero_image_url;
  const instructorName = instructor.business_name || instructor.name;

  const benefits = [
    { icon: Gift, title: "Free Re-Test", desc: "If you fail first time, we'll pay for your next test!", color: "#e74c3c" },
    { icon: BookOpen, title: "Free Theory Test", desc: "Need a theory test? We'll book it for free!", color: "#3498db" },
    { icon: Shield, title: "Earlier Test Guaranteed", desc: "We find you an earlier test date or your money back.", color: "#27ae60" },
    { icon: Search, title: "Free Cancellation Finder", desc: "Access to the best test finding software available.", color: "#9b59b6" },
    { icon: CreditCard, title: "Flexible Payments", desc: "Pay over up to 8 months with Klarna or Clearpay.", color: "#f39c12" },
    { icon: Clock, title: "Book Early, Save More", desc: "Early bird discounts and student offers available.", color: "#1abc9c" },
  ];

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Announcement Bar */}
      <div className="bg-[#e8f4fd] border-b border-[#c5dff0] py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm font-medium text-gray-700">
          <span className="flex items-center gap-1.5">🏷️ 10% Early Bird Discount</span>
          <span className="hidden md:flex items-center gap-1.5">🎁 Discounts</span>
          <span className="hidden md:flex items-center gap-1.5">🎓 Student Discount</span>
        </div>
      </div>

      {/* Hero Section - Split Layout */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Hero Image */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="relative rounded-2xl overflow-hidden shadow-lg"
            >
              <img src={defaultHeroImage} alt={instructorName} className="w-full h-[400px] lg:h-[520px] object-cover" />
              {/* Book Now Pay Later badge */}
              <img
                src={earlyTestBadge}
                alt="Earlier Test Guaranteed"
                className="absolute top-4 left-4 w-40 h-40 object-contain drop-shadow-lg"
              />
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Welcome Text */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight uppercase">
                  Welcome to<br />{instructorName}
                </h1>
                <p className="mt-4 text-gray-600 text-base leading-relaxed">
                  Search, compare and book direct with {instructor.name}. <strong>Book through Every Driver for a range of exclusive benefits.</strong>
                </p>
              </div>

              {/* Search Bar */}
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your postcode..."
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 text-base rounded-lg border-gray-300"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 rounded-lg text-white font-bold uppercase tracking-wide"
                  style={{ backgroundColor: primaryColor }}
                >
                  Search
                </Button>
              </form>

              {/* Course Type Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Link to={links.courses}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                    <div className="h-28 overflow-hidden">
                      <img src={intensiveCourseTile} alt="Intensive Courses" className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 uppercase">Intensive Courses</h3>
                      <p className="text-xs text-gray-500 mt-1">Fast-track your driving test</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs font-bold uppercase"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={links.services}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                    <div className="h-28 overflow-hidden">
                      <img src={weeklyLessonsTile} alt="Weekly Lessons" className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 uppercase">Weekly Lessons</h3>
                      <p className="text-xs text-gray-500 mt-1">Learn at your own pace</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs font-bold uppercase"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Section - Benefits Grid */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
              Every Driver
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mt-1">
              Why {instructorName}?
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              There are so many benefits when booking through Every Driver that are not available when booking direct.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-0 shadow-md overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${benefit.color}15` }}
                    >
                      <benefit.icon className="h-7 w-7" style={{ color: benefit.color }} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Stats Bar */}
      {avgRating && (
        <section className="py-8" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-12 text-white">
              <div className="text-center">
                <div className="text-4xl font-black">{avgRating}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-white/40"}`} />
                  ))}
                </div>
                <div className="text-sm text-white/70 mt-1">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black">{reviews.length}</div>
                <div className="text-sm text-white/70 mt-1">Verified Reviews</div>
              </div>
              {courses.length > 0 && (
                <div className="text-center">
                  <div className="text-4xl font-black">{courses.length}</div>
                  <div className="text-sm text-white/70 mt-1">Active Courses</div>
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
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { to: links.about, label: "About Me", sub: "Learn more" },
              { to: links.services, label: "Services", sub: "View options" },
              { to: links.courses, label: "Courses", sub: "Search & book" },
              { to: links.reviews, label: "Reviews", sub: `${reviews.length} reviews` },
              { to: links.contact, label: "Contact", sub: "Get in touch" },
            ].map((link) => (
              <Link key={link.to} to={link.to}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-md hover:-translate-y-1">
                  <CardContent className="p-4 text-center">
                    <h3 className="font-bold text-sm" style={{ color: primaryColor }}>{link.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{link.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12" style={{ backgroundColor: "#1a2332" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">
            Join over 5,200 happy pupils!
          </h2>
          <p className="text-gray-400 mb-6">
            Get on the road and enjoy your freedom. Pass your driving test with us!
          </p>
          <Link to={links.courses}>
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold uppercase rounded-lg text-white"
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
