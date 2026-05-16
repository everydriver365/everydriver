import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, Headphones, ChevronDown, Loader2, Timer, CalendarCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import Drive365Home from "@/components/home/Drive365Home";
import { Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { IOSCourseCard } from "@/components/IOSCourseCard";
import { Badge } from "@/components/ui/badge";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { CoursePlannerSheet } from "@/components/course-planner/CoursePlannerSheet";
import { HeroSearchSection } from "@/components/homepage/HeroSearchSection";
import drive365HeroTestCentre from "@/assets/drive365-hero-driver.webp";
import testswapBanner from "@/assets/testswap-banner.png";
import { FeatureDetailModal } from "@/components/FeatureDetailModal";
import { FeatureData } from "@/hooks/useHomepageFeatures";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useSiteImages } from "@/hooks/useSiteImages";
import { useFeaturedCourses } from "@/hooks/useFeaturedCourses";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import { getAreasForHost, areaToSlug } from "@/lib/whitelabelAreas";
import { supabase } from "@/integrations/supabase/client";
import { useDVSANews } from "@/hooks/useDVSANews";
import { useHomepageFeatures } from "@/hooks/useHomepageFeatures";
import { useHomepageHero } from "@/hooks/useHomepageHero";
import { useHomepageTestimonials } from "@/hooks/useHomepageTestimonials";
import { useIncludedFeatures, IncludedFeatureData } from "@/hooks/useIncludedFeatures";
import { useHomepageStats } from "@/hooks/useHomepageStats";
import { useBookingUpsells } from "@/hooks/useBookingUpsells";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHomepage } from "@/components/MobileHomepage";
import testimonialSarahFallback from "@/assets/testimonial-sarah.jpg";
import testimonialSarahNew from "@/assets/testimonial-sarah-new.png";
import testimonialJamesFallback from "@/assets/testimonial-james.jpg";
import testimonialEmmaFallback from "@/assets/testimonial-emma.jpg";
import localInstructorImg from "@/assets/local-instructor.jpg";
import drivingTestCentreImg from "@/assets/search-compare-book.avif";
import courseIntensive from "@/assets/course-intensive.jpg";
import courseSemiIntensive from "@/assets/course-semi-intensive.jpg";
import courseWeekly from "@/assets/course-weekly.jpg";
import videoThumbnail from "@/assets/video-thumbnail.jpg";
import newsFeatured from "@/assets/news-featured.jpg";
import newsArticle1 from "@/assets/news-article1.jpg";
import newsArticle2 from "@/assets/news-article2.jpg";
import featureRetestFallback from "@/assets/failed-driving-test-retest.png";
import featureAvailabilityFallback from "@/assets/feature-availability.jpg";
import featureTheoryFallback from "@/assets/feature-theory.jpg";
import featureTheoryPro from "@/assets/feature-theory-pro.jpg";
import featureCancellationFallback from "@/assets/feature-cancellation.jpg";
import featurePaymentsFallback from "@/assets/feature-payments.jpg";
import testimonialSarahM from "@/assets/testimonial-sarah-m.jpg";
import testimonialEmilyFallback from "@/assets/testimonial-emily.jpg";
import testimonialPriyaFallback from "@/assets/testimonial-priya.jpg";
import klarnaClearpayLogos from "@/assets/klarna-clearpay-logos.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoKlarna from "@/assets/logo-klarna.png";
import logoAdiCode from "@/assets/logo-adi-code.jpg";
import logoMsa from "@/assets/logo-msa.jpg";
import logoCpd from "@/assets/logo-cpd.jpg";
import logoCardPayments from "@/assets/logo-card-payments.png";
import heroMobile from "@/assets/hero-mobile.png";

import heroInstructorNew from "@/assets/hero-instructor-new.png";
import heroLearner from "@/assets/hero-learner.jpg";
import referFriends from "@/assets/refer-friends.png";
import winchesterHeroDesktop from "@/assets/winchester-hero-desktop.png";
// Features, stats, testimonials, and hero content are now loaded dynamically via hooks

export default function Index() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [postcode, setPostcode] = useState("");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureData | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { getImage, getAlt } = useSiteImages();
  const whitelabelSlug = getWhitelabelConfig()?.instructorSlug ?? null;
  // null = waiting to resolve, undefined = not whitelabel (show all), string = scope
  const [whitelabelInstructorId, setWhitelabelInstructorId] = useState<string | null | undefined>(
    whitelabelSlug ? null : undefined,
  );

  useEffect(() => {
    if (!whitelabelSlug) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("public_instructors")
        .select("id")
        .eq("app_slug", whitelabelSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (!cancelled) setWhitelabelInstructorId(data?.id ?? undefined);
    })();
    return () => { cancelled = true; };
  }, [whitelabelSlug]);

  const { courses: featuredCourses, loading: featuredLoading } = useFeaturedCourses(
    3,
    whitelabelInstructorId,
  );
  const { news: dvsaNews, loading: newsLoading } = useDVSANews();
  const { features } = useHomepageFeatures();
  const { hero } = useHomepageHero();
  const { featuredTestimonials, testimonials } = useHomepageTestimonials();
  const { features: includedFeatures } = useIncludedFeatures();
  const { stats } = useHomepageStats();
  const { data: upsells } = useBookingUpsells();
  const earlierTestUpsell = upsells?.find(u => u.name.toLowerCase().includes('earlier test'));

  const homepageJsonLd = [
    {
      id: "home-website-jsonld",
      data: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "EveryDriver",
        url: "https://everydriver.lovable.app/",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://everydriver.lovable.app/courses?postcode={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    },
    {
      id: "home-organization-jsonld",
      data: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "EveryDriver",
        url: "https://everydriver.lovable.app/",
        logo: "https://everydriver.lovable.app/everydriver-logo-full.svg",
      },
    },
  ];

  // Show mobile-optimized layout on mobile devices
  if (isMobile) {
    return (
      <>
        <SEOHead jsonLd={homepageJsonLd} />
        <MobileHomepage />
      </>
    );
  }

  // Helper to open feature modal - accepts both FeatureData and IncludedFeatureData
  const openFeatureModal = (feature: FeatureData | IncludedFeatureData) => {
    setSelectedFeature(feature as FeatureData);
    setFeatureModalOpen(true);
  };

  // ---- Whitelabel SEO copy (desktop hero) ----
  const wlConfig = getWhitelabelConfig();
  const wlCity = (() => {
    if (!wlConfig?.address) return "";
    const noPc = wlConfig.address.replace(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/i, "").trim().replace(/,\s*$/, "");
    const parts = noPc.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "";
  })();
  // Static UK area lists per known whitelabel host — extends the local SEO footprint
  // and powers dedicated /areas/<slug> location landing pages.
  const wlAreas = wlConfig ? getAreasForHost(wlConfig.host) : [];
  // Dynamic images from CMS with fallbacks - Hero testimonials
  const testimonialSarah = getImage("testimonial_sarah", testimonialSarahFallback);
  const testimonialJames = getImage("testimonial_james", testimonialJamesFallback);
  const testimonialEmma = getImage("testimonial_emma", testimonialEmmaFallback);
  const testimonialPriya = getImage("testimonial_priya", testimonialPriyaFallback);
  const testimonialEmily = getImage("testimonial_emily", testimonialEmilyFallback);

  // Get testimonial data for polaroids (first 4 featured)
  const polaroidTestimonials = featuredTestimonials.slice(0, 4);
  const getSarahData = polaroidTestimonials.find(t => t.image_key === 'testimonial_sarah') || { name: 'Sarah', content: 'Passed 1st time! ✨' };
  const getJamesData = polaroidTestimonials.find(t => t.image_key === 'testimonial_james') || { name: 'James', content: 'Intensive Course 🚗' };
  const getEmmaData = polaroidTestimonials.find(t => t.image_key === 'testimonial_emma') || { name: 'Emma', content: 'Weekly Lessons 💪' };
  const getPriyaData = polaroidTestimonials.find(t => t.image_key === 'testimonial_priya') || { name: 'Priya', content: 'Semi-Intensive 🎉' };
  
  // Stats are now loaded dynamically via useHomepageStats hook
  // Dynamic images - Learning paths
  const courseIntensiveImg = getImage("course_intensive", courseIntensive);
  const courseSemiIntensiveImg = getImage("course_semi_intensive", courseSemiIntensive);
  const courseWeeklyImg = getImage("course_weekly", courseWeekly);
  
  // Dynamic images - What's included features
  const featureRetest = getImage("feature_retest", featureRetestFallback);
  const featureAvailability = getImage("feature_availability", featureAvailabilityFallback);
  const featureTheory = getImage("feature_theory", featureTheoryFallback);
  const featureTheoryProImg = getImage("feature_theory_pro", featureTheoryPro);
  const featureCancellation = getImage("feature_cancellation", featureCancellationFallback);
  const featurePayments = getImage("feature_payments", featurePaymentsFallback);
  
  // Dynamic video thumbnail and video URL
  const videoThumbnailImg = getImage("video_thumbnail", videoThumbnail);
  const welcomeVideoUrl = getImage("welcome_video", "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/courses?postcode=${postcode}`;
  };

  return (
    <MainLayout>
      <SEOHead jsonLd={homepageJsonLd} />
      <Drive365Home
        afterLearningPaths={<>
          <section style={{ padding: "56px 5%", background: "#F0F2F5", width: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1A52A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              What's included
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5, marginBottom: 10 }}>
              Everything you need to pass
            </h2>
            <p style={{ fontSize: 15, color: "#5F6B7A", lineHeight: 1.6, maxWidth: 520, marginBottom: 36 }}>
              Every course comes with the tools, support and flexibility to get you test-ready — included for free.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              {includedFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                const featureImage = feature.image_url || (() => {
                  switch(feature.title.toLowerCase()) {
                    case 'theory test support': return featureTheory;
                    case 'flexible payments': return featurePayments;
                    case 'free cancellation': return featureCancellation;
                    case 'free re-test': return featureRetest;
                    case 'live availability': return featureAvailability;
                    case 'theory test pro': return featureTheoryProImg;
                    default: return null;
                  }
                })();

                return (
                  <motion.button
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    viewport={{ once: true }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openFeatureModal(feature)}
                    style={{
                      background: "#FFF",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid #E0E4EB",
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ height: 180, overflow: "hidden", background: "#F0F2F5" }}>
                      {featureImage ? (
                        <img
                          src={featureImage}
                          alt={feature.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8ECF2" }}>
                          <IconComponent className="h-10 w-10 text-[#1A52A0] opacity-40" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F2044", marginBottom: 6 }}>{feature.title}</h3>
                      <p style={{ fontSize: 13, color: "#5F6B7A", lineHeight: 1.6, marginBottom: 14 }}>{feature.description}</p>
                      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#1A52A0" }}>
                        Learn more <ChevronRight size={12} color="#1A52A0" strokeWidth={2.2} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Featured Courses Section */}
          <section className="bg-background py-16">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mb-8 flex items-center justify-between"
              >
                <div>
                  <Badge className="mb-2 border-0 bg-primary text-primary-foreground">
                    Available Now
                  </Badge>
                  <h2 className="text-2xl font-bold md:text-3xl">Featured Courses</h2>
                </div>
                <Link to="/courses">
                  <Button variant="outline" className="hidden gap-2 sm:flex">
                    View All Courses
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-[340px] animate-pulse rounded-xl bg-muted" />
                    ))}
                  </>
                ) : featuredCourses.length > 0 ? (
                  featuredCourses.map((course, index) => (
                    <motion.div
                      key={`${course.instructor.id}-${course.hours}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <IOSCourseCard
                        instructor={course.instructor}
                        hours={course.hours}
                        nextAvailable={course.bookableDate}
                        courseImageUrl={course.courseImageUrl}
                        isPopular={course.isPopular}
                        availableFrom={course.availableFrom}
                        features={course.features}
                        isIntensive={course.isIntensive}
                        discountedPrice={course.discountedPrice}
                        customFeatures={course.customFeatures}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-muted-foreground">No courses available at the moment. Check back soon!</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center sm:hidden">
                <Link to="/courses">
                  <Button className="gap-2">
                    View All Courses
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Testimonials Section — Social Proof Wall */}
          <section className="bg-gradient-to-b from-primary/5 via-accent/5 to-background py-24">
            <div className="container">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    <img src={testimonialSarah} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                    <img src={testimonialJames} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                    <img src={testimonialEmma} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                    <img src={testimonialSarahM} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                  </div>
                  <span className="text-sm text-muted-foreground">6,499+ happy drivers</span>
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold md:text-4xl"
                >
                  Trusted by Thousands
                </motion.h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {testimonials.filter(t => !t.is_featured).slice(0, 6).map((testimonial, i) => (
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
        </>}
      />

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />


      {/* From Nervous to Road Ready Section — Warm Organic */}
      <section className="bg-gradient-to-b from-orange-50 via-amber-50/40 to-background py-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <h2 className="text-4xl font-black">Every Learner's Journey<br /><span className="text-amber-600">Starts Here</span></h2>
            <p className="text-muted-foreground mt-3">From first lesson nerves to passing-day celebrations</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah M.", course: "5-Day Intensive", img: testimonialSarahM, text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points." },
              { name: "Emily R.", course: "Semi-Intensive", img: testimonialEmily, text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made." },
              { name: "Priya T.", course: "10-Day Course", img: testimonialPriya, text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job." },
            ].map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} viewport={{ once: true }}
                className="text-center"
              >
                <img src={t.img} alt={t.name} className="h-20 w-20 rounded-full object-cover mx-auto mb-4 shadow-lg ring-4 ring-amber-100" />
                <div className="flex justify-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.text}"</p>
                <p className="mt-3 text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.course}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }}
            className="mt-14 bg-card rounded-3xl p-8 shadow-lg border flex items-center justify-between flex-wrap gap-6"
          >
            <div className="flex gap-8">
              {stats.slice(0, 3).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-black text-amber-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 font-bold" asChild>
              <Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Video Story Section — Drive365 Style */}
      <section style={{ background: "#F0F2F5" }} className="py-20">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Video preview card */}
            <motion.button
              type="button"
              onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
              disabled={!welcomeVideoUrl}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative w-full overflow-hidden text-left"
              style={{
                borderRadius: 18,
                border: "1px solid #E0E4EB",
                background: "#fff",
                boxShadow: "0 12px 32px rgba(15, 32, 68, 0.08)",
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={videoThumbnailImg}
                  alt="Watch our story"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(15, 32, 68, 0.25)",
                    }}
                  >
                    <Play className="h-7 w-7 ml-1" style={{ color: "#1A52A0", fill: "#1A52A0" }} />
                  </div>
                </div>
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full"
                  style={{ background: "rgba(255,255,255,0.95)", color: "#1A52A0", letterSpacing: "0.08em" }}
                >
                  2 min watch
                </div>
              </div>
            </motion.button>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div
                className="text-xs font-semibold uppercase mb-3"
                style={{ color: "#1A52A0", letterSpacing: "0.08em" }}
              >
                Our Story
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold mb-5 leading-[1.1]"
                style={{ color: "#0F2044", letterSpacing: -0.5 }}
              >
                Watch how learners pass with confidence
              </h2>
              <p className="text-base md:text-lg mb-7 leading-relaxed" style={{ color: "#4A5568" }}>
                Discover why thousands of learners trust us with their driving journey — from first lesson nerves to test day success.
              </p>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-3">
                  {[testimonialSarahFallback, testimonialJamesFallback, testimonialEmmaFallback].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Learner"
                      className="h-11 w-11 rounded-full object-cover"
                      style={{ border: "2px solid #fff", boxShadow: "0 2px 6px rgba(15,32,68,0.12)" }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "#4A5568" }}>
                    4.9 from 6,499 learner reviews
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                disabled={!welcomeVideoUrl}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "#1A52A0",
                  color: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 6px 16px rgba(26, 82, 160, 0.25)",
                }}
              >
                <Play className="h-4 w-4 fill-white" /> Play Video
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <div className="aspect-video">
            {welcomeVideoUrl && videoModalOpen && (
              <video
                src={welcomeVideoUrl}
                className="h-full w-full"
                controls
                autoPlay
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Latest News & Tips — Warm Blog */}
      <section className="bg-gradient-to-b from-orange-50 to-background py-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-4xl font-black">News & Tips</h2>
            <p className="text-muted-foreground mt-2">Helpful reads for your driving journey</p>
          </motion.div>

          {newsLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : dvsaNews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {dvsaNews.slice(0, 3).map((article, i) => (
                <motion.div
                  key={article.slug || article.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/news/${article.slug}`} className="group block">
                    <div className="rounded-2xl overflow-hidden shadow-md mb-4">
                      <img
                        src={article.imageUrl || (i === 0 ? newsFeatured : i === 1 ? newsArticle1 : newsArticle2)}
                        alt={article.title}
                        className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100 mb-2">
                      {article.category || "DVSA News"}
                    </Badge>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-amber-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} • 3 min read
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Latest DVSA News & Updates", desc: "Stay up to date with the latest driving test news.", img: newsFeatured },
                { title: "Tips for New Learners", desc: "Expert advice to get you started on your journey.", img: newsArticle1 },
                { title: "Check Back for More", desc: "We regularly publish new articles and tips.", img: newsArticle2 },
              ].map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} viewport={{ once: true }} className="group">
                  <div className="rounded-2xl overflow-hidden shadow-md mb-4">
                    <img src={article.img} alt={article.title} className="h-44 w-full object-cover" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100 mb-2">DVSA News</Badge>
                  <h3 className="font-bold text-lg mb-1">{article.title}</h3>
                  <p className="text-sm text-muted-foreground">{article.desc}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/news">
              <Button variant="outline" className="gap-2">
                View All Articles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="grid grid-cols-2 gap-4 bg-card p-6 shadow-lg md:grid-cols-4 md:gap-8 md:p-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section — Bento Grid with Images */}
      <section className="bg-background py-24">
        <div className="container max-w-6xl">
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
              {
                title: "Search, Compare & Book",
                description: "Find and compare local instructors, check real-time availability, and book directly online.",
                link: "/courses",
                image: drivingTestCentreImg,
              },
              {
                title: "Parent Portal",
                description: "Stay informed with lesson updates and payment visibility.",
                link: "/parent",
                image: getImage("feature_parent_portal", referFriends)
              },
              {
                title: "Live Availability",
                description: "Real-time calendar sync shows when instructors are free.",
                image: getImage("feature_availability", featureAvailabilityFallback)
              },
              {
                title: "Local Instructors",
                description: "Find certified instructors near you by postcode.",
                image: localInstructorImg
              },
              {
                title: "Track Progress",
                description: "Monitor your journey with detailed progress reports.",
                image: getImage("feature_progress", featureTheoryFallback)
              },
              {
                title: "Theory Support",
                description: "Free theory test prep with practice questions and mock tests.",
                link: "/theory",
                image: getImage("feature_theory", featureTheoryFallback)
              },
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
                    <img
                      src={f.image}
                      alt={f.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
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

      {/* Testimonials Section — Social Proof Wall */}
      <section className="bg-gradient-to-b from-primary/5 via-accent/5 to-background py-24">
        <div className="container">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                <img src={testimonialSarah} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                <img src={testimonialJames} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                <img src={testimonialEmma} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                <img src={testimonialSarahM} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
              </div>
              <span className="text-sm text-muted-foreground">6,499+ happy drivers</span>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl font-bold md:text-4xl"
            >
              Trusted by Thousands
            </motion.h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {testimonials.filter(t => !t.is_featured).slice(0, 6).map((testimonial, i) => (
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

      {/* CTA Section — Bold Asymmetric */}
      <section className="py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="md:col-span-2 rounded-3xl bg-primary p-10 md:p-14 flex flex-col justify-center"
            >
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                Ready to Start<br />Driving?
              </h2>
              <p className="text-white/70 mb-8 text-base max-w-md">
                Search, compare and book your driving lessons in seconds. Over 650 instructors nationwide.
              </p>
              <Link to="/courses">
                <Button size="lg" className="w-fit bg-white text-primary hover:bg-white/90 font-bold gap-2 px-8">
                  Search Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="rounded-3xl bg-amber-400 p-8 text-center"
              >
                <Zap className="h-8 w-8 text-amber-900 mx-auto mb-2" />
                <div className="font-black text-amber-900 text-lg">Intensive Courses</div>
                <div className="text-amber-800 text-sm">Pass in as little as 1 week</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="rounded-3xl bg-zinc-900 p-8 text-center"
              >
                <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <div className="font-black text-white text-lg">Free Re-Test</div>
                <div className="text-zinc-400 text-sm">We've got you covered</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container max-w-4xl text-center space-y-5">
          <Badge className="bg-accent text-accent-foreground text-sm">Now Recruiting</Badge>
          <h2 className="text-2xl md:text-3xl font-bold">Are You a Driving Instructor?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join the Drive365 franchise — free private healthcare, £50 bonus every time a pupil passes,
            and the best tech platform in the business. From just £99/week.
          </p>
          <Button size="lg" variant="secondary" className="text-base px-8" asChild>
            <Link to="/drive365/franchise">
              Learn More <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Desktop Trust Badges - V9 Stacked Compact Design */}
      <section className="hidden md:block bg-card border-y border-border py-6">
        <div className="container max-w-3xl space-y-4">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img src={logoAdiCode} alt="ADI Code of Practice" className="h-9 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img src={logoMsa} alt="MSA GB - For all driver trainers" className="h-9 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img src={logoCpd} alt="Continuing Professional Development" className="h-9 object-contain" />
            </div>
          </div>
          <div className="h-px bg-border w-full" />
          <div className="flex items-center justify-center gap-6">
            <span className="text-sm text-muted-foreground">Pay with</span>
            <img src={logoCardPayments} alt="Visa, MasterCard, Maestro, JCB" className="h-6 object-contain" />
            <img src={logoKlarna} alt="Klarna" className="h-6 object-contain rounded" />
            <img src={logoClearpay} alt="Clearpay" className="h-6 object-contain rounded" />
          </div>
        </div>
      </section>

      <CoursePlannerSheet
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        mode="public"
        source="drive365"
      />
    </MainLayout>
  );
}
