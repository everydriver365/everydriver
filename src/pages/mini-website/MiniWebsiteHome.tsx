import { useParams, Link, useNavigate } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { useHomepageTestimonials } from "@/hooks/useHomepageTestimonials";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { FeatureDetailModal } from "@/components/FeatureDetailModal";
import { ParentPortalPreviewModal } from "@/components/mini-website/ParentPortalPreviewModal";
import { LiveBookingPreviewModal } from "@/components/mini-website/LiveBookingPreviewModal";
import { TrackProgressPreviewModal } from "@/components/mini-website/TrackProgressPreviewModal";
import { FeatureData } from "@/hooks/useHomepageFeatures";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Star, Award, MapPin, Search, CheckCircle, Gift, BookOpen, Shield, CreditCard, Clock, Heart, ArrowRight, Zap, User, ChevronRight, X, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import earlyTestBadge from "@/assets/free-retest-badge.png";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.webp";
import klarnaCleanpayLogos from "@/assets/klarna-clearpay-logos.png";
import klarnaRoundLogo from "@/assets/klarna-round-logo.svg";
import clearpayRoundLogo from "@/assets/clearpay-round-logo.svg";
import courseIntensive from "@/assets/intensive-course-tile.jpg";
import courseSemiIntensive from "@/assets/semi-intensive-tile.jpg";
import courseWeekly from "@/assets/weekly-lessons-tile.jpeg";
import drivingTestCentreImg from "@/assets/search-compare-book.avif";
import studentPassPolaroid from "@/assets/student-pass-polaroid.jpg";
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
  const [selectedFeature, setSelectedFeature] = useState<FeatureData | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [parentPortalOpen, setParentPortalOpen] = useState(false);
  const [liveBookingOpen, setLiveBookingOpen] = useState(false);
  const [trackProgressOpen, setTrackProgressOpen] = useState(false);

  const openFeatureModal = (feature: typeof includedFeatures[0]) => {
    const mapped: FeatureData = {
      id: feature.id,
      icon: feature.icon,
      title: feature.title,
      description: feature.description,
      detailed_content: feature.detailed_content,
      image_url: feature.image_url,
    };
    setSelectedFeature(mapped);
    setFeatureModalOpen(true);
  };

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
      <div className="min-h-screen p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Sorry, we couldn't find this instructor's website.
          </p>
          <Link to={`/i/${slug}`}>
            <Button>Find Instructors</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const primaryColor = instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = (instructor.website_heading_color === "#ffffff" || instructor.website_heading_color === "#FFFFFF") ? undefined : instructor.website_heading_color;
  const textColor = (instructor.website_text_color === "#ffffff" || instructor.website_text_color === "#FFFFFF") ? undefined : instructor.website_text_color;
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
    <MiniWebsiteLayout instructor={instructor} pageTitle="Home" pageDescription={`Book driving lessons with ${instructor.business_name || instructor.name}. Professional driving instruction to help you pass your test.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Announcement Bar - Dismissible Banner */}
      {showPromoBanner && (
        <div className="hidden md:block bg-gradient-to-r from-[#d4edda] to-[#b7dfbf] py-3 px-4 relative">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <div className="bg-[#28a745] rounded-full p-1">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-[#142040] font-medium">
              <span className="font-bold">New Student Offer:</span> Get 10% off your first lesson + free theory test access
            </p>
            <a href={`tel:${instructor.phone || ''}`} className="hidden md:inline-flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors ml-2" style={{ backgroundColor: primaryColor }}>
              Call Now <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <button onClick={() => setShowPromoBanner(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#142040]/40 hover:text-[#142040]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Section — Polaroid Stack */}
      <section className="bg-gradient-to-br from-amber-50 via-background to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 space-y-6 sm:space-y-8">
          {/* Top row: Polaroid photo + headline */}
          <div className="flex flex-col gap-4 sm:flex-row items-center sm:items-start sm:gap-8">
            <div className="flex items-end justify-center w-full sm:w-auto sm:shrink-0">
              {/* Polaroid 1 — Instructor */}
              <motion.div
                initial={{ rotate: -3, opacity: 0 }}
                animate={{ rotate: -3, opacity: 1 }}
                className="bg-white p-2 sm:p-3 rounded-xl shadow-xl -rotate-3 relative z-10"
              >
                <img
                  src={page?.hero_image_url || defaultHeroImage}
                  alt={instructorName}
                  className="w-[45vw] h-[45vw] max-w-[220px] max-h-[220px] sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-lg object-cover"
                />
                <img
                  src={earlyTestBadge}
                  alt="Earlier Test Guaranteed"
                  className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Polaroid 2 — Student passing */}
              <motion.div
                initial={{ rotate: 4, opacity: 0 }}
                animate={{ rotate: 4, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-2 sm:p-3 rounded-xl shadow-xl rotate-[4deg] relative -ml-8 sm:-ml-10"
              >
                <img
                  src={studentPassPolaroid}
                  alt="Student passing their driving test"
                  className="w-[38vw] h-[38vw] max-w-[190px] max-h-[190px] sm:w-40 sm:h-40 lg:w-56 lg:h-56 rounded-lg object-cover"
                />
                <div className="text-right mt-1 pr-1">
                  <span className="text-[10px] sm:text-sm font-bold text-green-600">First Time Pass! 🎉</span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pt-1 sm:pt-4 flex-1"
            >
              <Badge className="bg-green-100 text-green-800 border-0 text-[10px] sm:text-xs mb-2 sm:mb-3">
                <Award className="h-3 w-3 mr-1" />Free Re-Test If You Fail
              </Badge>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-extrabold leading-tight text-foreground">
                {page?.hero_heading ? (
                  <>{page.hero_heading}</>
                ) : (
                  <>Driving Lessons with{" "}<span style={{ color: primaryColor }}>{instructorName}</span></>
                )}
              </h1>
              {page?.hero_subheading && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 font-medium">
                  {page.hero_subheading}
                </p>
              )}
              {avgRating && (
                <div className="flex items-center gap-1.5 mt-2 sm:mt-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        s <= Math.round(Number(avgRating))
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="font-semibold text-xs sm:text-sm text-muted-foreground ml-1">
                    {avgRating} ({reviews.length} reviews)
                  </span>
                </div>
              )}
              <p className="text-muted-foreground text-sm sm:text-base mt-2 sm:mt-3 max-w-lg">
                Book direct and pass — weekly or intensive driving courses available now
              </p>
            </motion.div>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const appSlug = instructor.app_slug;
              const params = postcode.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : '';
              navigate(`/i/${appSlug}/courses${params}`);
            }}
            className="flex gap-2 max-w-xl"
          >
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="pl-9 sm:pl-10 h-11 sm:h-12 rounded-full border-border shadow-sm"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-11 sm:h-12 px-5 sm:px-8 rounded-full font-bold text-white shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </form>

          {/* Course Tiles */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Link to={links.services}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <img src={courseWeekly} alt="Weekly Lessons" className="w-full h-20 sm:h-32 lg:h-40 object-cover" />
                <div className="p-2 sm:p-3 text-center">
                  <div className="font-bold text-[11px] sm:text-sm text-foreground">Weekly</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">From £{instructor.hourly_rate || 40}/hr</div>
                </div>
              </div>
            </Link>
            <Link to={links.courses}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <img src={courseSemiIntensive} alt="Semi-Intensive" className="w-full h-20 sm:h-32 lg:h-40 object-cover" />
                <div className="p-2 sm:p-3 text-center">
                  <div className="font-bold text-[11px] sm:text-sm text-foreground">Semi-Intensive</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">20-30 hours</div>
                </div>
              </div>
            </Link>
            <Link to={links.courses}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <img src={courseIntensive} alt="Intensive" className="w-full h-20 sm:h-32 lg:h-40 object-cover" />
                <div className="p-2 sm:p-3 text-center">
                  <div className="font-bold text-[11px] sm:text-sm text-foreground">Intensive</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Test in a week</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Finance badges */}
          <div className="flex items-center gap-3 justify-center">
            <img src={klarnaRoundLogo} alt="Klarna" className="h-6 w-6 sm:h-8 sm:w-8" />
            <img src={clearpayRoundLogo} alt="Clearpay" className="h-6 w-6 sm:h-8 sm:w-8" />
            <img src={klarnaCleanpayLogos} alt="Pay with Klarna or Clearpay" className="h-10 sm:h-12 object-contain" />
          </div>

          {/* Earlier Test Guarantee CTA */}
          <Link to={links.contact} className="block">
            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-shadow">
              <img src={earlyTestBadge} alt="Earlier Test Guaranteed" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base text-foreground">Earlier Test Guaranteed</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">We find you an earlier test date or your money back</div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-500 shrink-0" />
            </div>
          </Link>
        </div>
      </section>

      {/* Choose Your Learning Path */}
      <section style={{ backgroundColor: '#e9f4f9' }} className="py-10 sm:py-16">
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
            <h2 className="mb-4 text-3xl font-bold" style={{ color: primaryColor }}>
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
                <h3 className="text-xl font-bold" style={{ color: primaryColor }}>Intensive Courses</h3>
                <p className="mt-2 text-sm text-muted-foreground">Full immersion driving experience. Learn everything in concentrated sessions and pass your test in record time.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>30-40 hours</strong> of lessons</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" /><span>Pass in <strong>1-2 weeks</strong></span></div>
                  <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /><span>Test booking <strong>included</strong></span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£{((instructor.hourly_rate || 40) * 35).toLocaleString()}</div>
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
                <h3 className="text-xl font-bold" style={{ color: primaryColor }}>Semi-Intensive</h3>
                <p className="mt-2 text-sm text-muted-foreground">The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practice between sessions.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>30 hours</strong> of lessons</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" /><span>Pass in <strong>2-4 weeks</strong></span></div>
                  <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /><span><strong>Flexible</strong> scheduling</span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£{((instructor.hourly_rate || 40) * 25).toLocaleString()}</div>
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
                <h3 className="text-xl font-bold" style={{ color: primaryColor }}>Weekly Lessons</h3>
                <p className="mt-2 text-sm text-muted-foreground">Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /><span><strong>1-2 hours</strong> per week</span></div>
                  <div className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-primary" /><span><strong>Pay as you go</strong> or packages</span></div>
                  <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-primary" /><span><strong>Same instructor</strong> every week</span></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£{instructor.hourly_rate || 40}<span className="text-sm font-normal text-muted-foreground">/hour</span></div>
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
      <section style={{ backgroundColor: '#e9f4f9' }} className="py-10 sm:py-16">
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
            <h2 className="mb-4 text-3xl font-bold" style={{ color: primaryColor }}>
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
                <motion.button
                  key={feature.id}
                  onClick={() => openFeatureModal(feature)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  viewport={{ once: true }}
                  className="rounded-2xl overflow-hidden bg-card/70 backdrop-blur ring-1 ring-border/50 shadow-sm hover:shadow-lg transition-all group text-left cursor-pointer"
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
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section style={{ backgroundColor: '#e9f4f9' }} className="py-12 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-4 bg-primary text-primary-foreground border-0">All-in-One Platform</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
              Everything You Need to <span>Learn to Drive</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform connects learners, instructors, and parents in one seamless experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Book Direct", description: "Find and compare local instructors, check real-time availability, and book directly online.", image: drivingTestCentreImg, link: links.courses },
              { title: "Parent Portal", description: "Stay informed with lesson updates and payment visibility.", image: referFriends, link: null, onClick: () => setParentPortalOpen(true) },
              { title: "Live Availability", description: "Real-time calendar sync shows when instructors are free.", image: defaultHeroImage, link: null, onClick: () => setLiveBookingOpen(true) },
              { title: "Local Instructors", description: "Find certified instructors near you by postcode.", image: localInstructorImg, link: links.about },
              { title: "Track Progress", description: "Monitor your journey with detailed progress reports.", image: intensiveCourseTile, link: null, onClick: () => setTrackProgressOpen(true) },
              { title: "Theory Support", description: "Free theory test prep with practice questions and mock tests.", image: weeklyLessonsTile, link: "/theory" },
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
                    <h3 className="font-bold text-sm mb-1" style={{ color: primaryColor }}>{f.title}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">{f.description}</p>
                  </div>
                </motion.div>
              );
              if ((f as any).onClick) return <div key={i} onClick={(f as any).onClick}>{content}</div>;
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
      <section style={{ backgroundColor: '#e9f4f9' }} className="py-12 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold md:text-4xl text-foreground"
            >
              Trusted by Many
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
      </section>


      {/* Quick Links */}
      <section className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-black text-center mb-6 sm:mb-8" style={{ color: primaryColor }}>
            Explore More
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: links.about, label: "About Me", sub: "Learn more", icon: "👤" },
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



      <FeatureDetailModal
        feature={selectedFeature}
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />
      <ParentPortalPreviewModal
        open={parentPortalOpen}
        onOpenChange={setParentPortalOpen}
        primaryColor={primaryColor}
      />
      <LiveBookingPreviewModal
        open={liveBookingOpen}
        onOpenChange={setLiveBookingOpen}
        primaryColor={primaryColor}
      />
      <TrackProgressPreviewModal
        open={trackProgressOpen}
        onOpenChange={setTrackProgressOpen}
        primaryColor={primaryColor}
      />
    </MiniWebsiteLayout>
  );
}
