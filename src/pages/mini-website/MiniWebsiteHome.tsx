import { useParams, Link, useNavigate } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { useHomepageTestimonials } from "@/hooks/useHomepageTestimonials";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Star, Award, MapPin, Search, CheckCircle, Gift, BookOpen, Shield, CreditCard, Clock, Heart, ArrowRight, Zap, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import earlyTestBadge from "@/assets/earlier-test-guaranteed-badge.png";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.webp";
import klarnaCleanpayLogos from "@/assets/klarna-clearpay-logos.png";
import courseIntensive from "@/assets/course-intensive.jpg";
import courseSemiIntensive from "@/assets/course-semi-intensive.jpg";
import courseWeekly from "@/assets/course-weekly.jpg";
import drivingTestCentreImg from "@/assets/search-compare-book.avif";
import localInstructorImg from "@/assets/local-instructor.jpg";
import referFriends from "@/assets/refer-friends.png";

interface MiniWebsiteHomeProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteHome({ subdomainSlug }: MiniWebsiteHomeProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "home");
  const links = useMiniWebsiteLinks(slug);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [postcode, setPostcode] = useState("");
  const { features: includedFeatures } = useIncludedFeatures();
  const { testimonials: homepageTestimonials } = useHomepageTestimonials();

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
      <section style={{ backgroundColor: '#17A9FD' }}>
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
                  navigate(`/i/${slug}/courses${params}`);
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
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-bold text-foreground bg-accent px-3 py-1 rounded-full shadow-sm">Spread the Cost</span>
                <img src={klarnaCleanpayLogos} alt="Pay with Klarna or Clearpay" className="h-12 object-contain" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choose Your Learning Path */}
      <section style={{ backgroundColor: '#17A9FD' }} className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Find Your Perfect Fit
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Choose Your Learning Path
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
              Whether you want to pass quickly or learn at your own pace, we have the perfect course for you
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Intensive Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl bg-card"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={courseIntensive} alt="Intensive Courses" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <Badge className="absolute right-3 top-3 border-0 bg-primary text-primary-foreground gap-1">
                  <Zap className="h-3 w-3" /> Fast Track
                </Badge>
                <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="absolute left-2 bottom-2 w-32 h-32 drop-shadow-lg object-contain" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground">Intensive Courses</h3>
                <p className="mt-2 text-sm text-muted-foreground">Full immersion driving experience. Learn everything in concentrated sessions and pass your test in record time.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>30-40 hours</strong> of lessons</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" /><span>Pass in <strong>1-2 weeks</strong></span></div>
                  <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /><span>Test booking <strong>included</strong></span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£1,299</div>
                  </div>
                  <Link to={links.courses}>
                    <Button className="gap-2">View Courses <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Semi-Intensive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl bg-card"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={courseSemiIntensive} alt="Semi-Intensive Courses" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <Badge className="absolute right-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                  <Star className="h-3 w-3" /> Popular
                </Badge>
                <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="absolute left-2 bottom-2 w-32 h-32 drop-shadow-lg object-contain" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground">Semi-Intensive</h3>
                <p className="mt-2 text-sm text-muted-foreground">The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practice between sessions.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>30 hours</strong> of lessons</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" /><span>Pass in <strong>2-4 weeks</strong></span></div>
                  <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /><span><strong>Flexible</strong> scheduling</span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£999</div>
                  </div>
                  <Link to={links.courses}>
                    <Button className="gap-2">View Courses <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Weekly Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl bg-card"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={courseWeekly} alt="Weekly Lessons" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <Badge className="absolute right-3 top-3 border-0 bg-blue-500 text-white gap-1">
                  <Heart className="h-3 w-3" /> Flexible
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground">Weekly Lessons</h3>
                <p className="mt-2 text-sm text-muted-foreground">Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>1-2 hours</strong> per week</span></div>
                  <div className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-primary" /><span><strong>Pay as you go</strong> or packages</span></div>
                  <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-primary" /><span><strong>Same instructor</strong> every week</span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£35<span className="text-sm font-normal text-muted-foreground">/hour</span></div>
                  </div>
                  <Link to={links.courses}>
                    <Button className="gap-2">View Lessons <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section style={{ backgroundColor: '#17A9FD' }} className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Why Learners Love Us
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              What's Included With Every Course
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to pass your driving test, all included for free.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {includedFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  viewport={{ once: true }}
                  className="rounded-2xl overflow-hidden bg-card/70 backdrop-blur ring-1 ring-border/50 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="h-36 md:h-48 overflow-hidden">
                    {feature.image_url ? (
                      <img
                        src={feature.image_url}
                        alt={feature.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                        <IconComponent className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-xs md:text-sm text-foreground">{feature.title}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="bg-background py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary text-primary-foreground border-0">All-in-One Platform</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Everything You Need to <span className="text-primary">Learn to Drive</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform connects learners, instructors, and parents in one seamless experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Search, Compare & Book", description: "Find and compare local instructors, check real-time availability, and book directly online.", image: drivingTestCentreImg, link: links.courses },
              { title: "Parent Portal", description: "Stay informed with lesson updates and payment visibility.", image: referFriends, link: links.contact },
              { title: "Live Availability", description: "Real-time calendar sync shows when instructors are free.", image: defaultHeroImage, link: links.courses },
              { title: "Local Instructors", description: "Find certified instructors near you by postcode.", image: localInstructorImg, link: links.about },
              { title: "Track Progress", description: "Monitor your journey with detailed progress reports.", image: intensiveCourseTile, link: links.courses },
              { title: "Theory Support", description: "Free theory test prep with practice questions and mock tests.", image: weeklyLessonsTile, link: links.courses },
            ].map((f, i) => {
              const content = (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="overflow-hidden h-36 md:h-48">
                    <img src={f.image} alt={f.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground text-sm mb-1">{f.title}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">{f.description}</p>
                  </div>
                </motion.div>
              );
              return f.link ? <Link key={i} to={f.link}>{content}</Link> : <div key={i}>{content}</div>;
            })}
          </div>
        </div>
      </section>


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

      {/* Trusted by Thousands */}
      <section className="bg-gradient-to-b from-primary/5 via-accent/5 to-background py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl font-bold md:text-4xl text-foreground"
            >
              Trusted by Thousands
            </motion.h2>
          </div>
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
                <p className="text-xs font-semibold mt-3">
                  {testimonial.name}{" "}
                  <span className="font-normal text-muted-foreground">· {testimonial.role}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Quick Links */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-black text-center mb-8" style={{ color: primaryColor }}>
            Explore More
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { to: links.about, label: "About Me", sub: "Learn more", icon: "👤" },
              { to: links.services, label: "Services", sub: "View options", icon: "🚗" },
              { to: links.courses, label: "Courses", sub: "Search & book", icon: "📚" },
              { to: links.reviews, label: "Reviews", sub: `${reviews.length} reviews`, icon: "⭐" },
              { to: links.contact, label: "Contact", sub: "Get in touch", icon: "📞" },
            ].map((link, i) => (
              <Link key={link.to} to={link.to}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-2xl mb-1">{link.icon}</span>
                  <h3 className="font-bold text-sm" style={{ color: primaryColor }}>
                    {link.label}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{link.sub}</p>
                </motion.div>
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
