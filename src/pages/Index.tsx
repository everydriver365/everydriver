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
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
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
          <section style={{ padding: "56px 5%", background: "#F6F6F8", width: "100%" }}>
            {(() => {
              const resolveImage = (title: string, url?: string) => {
                if (url) return url;
                switch (title.toLowerCase()) {
                  case 'free theory test': return featureTheory;
                  case 'flexible payments': return featurePayments;
                  case 'free test swapping': return featureCancellation;
                  case 'free re-test': return featureRetest;
                  case 'theory test pro': return featureTheoryProImg;
                  default: return null;
                }
              };
              const findByTitle = (needle: string) =>
                includedFeatures.find(f => f.title.toLowerCase() === needle.toLowerCase());

              const retest = findByTitle('FREE Re-Test');
              const theory = findByTitle('Free Theory Test');
              const swap = findByTitle('Free Test Swapping');
              const payments = findByTitle('Flexible Payments');
              const theoryPro = findByTitle('Theory Test Pro');

              const FeaturedCard = ({
                feature, accent, tagLabel, tagBg,
              }: { feature: any; accent: string; tagLabel: string; tagBg: string }) => {
                if (!feature) return null;
                const img = resolveImage(feature.title, feature.image_url);
                return (
                  <button
                    onClick={() => openFeatureModal(feature)}
                    style={{
                      background: "#F9FAFB",
                      border: `2px solid ${accent}`,
                      borderRadius: 6,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {img && (
                      <img src={img} alt={feature.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{
                        background: tagBg, color: accent, fontSize: 8, fontWeight: 700,
                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                        display: "inline-block", marginBottom: 2, alignSelf: "flex-start",
                      }}>{tagLabel}</span>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0A0E27", margin: 0 }}>{feature.title}</h3>
                      <p style={{ fontSize: 10, color: "#4B5563", lineHeight: 1.5, margin: 0, flex: 1 }}>{feature.description}</p>
                      <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginTop: 4 }}>Learn more ›</div>
                    </div>
                  </button>
                );
              };

              const SmallCard = ({
                feature, accent, tagLabel, tagBg,
              }: { feature: any; accent: string; tagLabel: string; tagBg: string }) => {
                if (!feature) return null;
                const img = resolveImage(feature.title, feature.image_url);
                return (
                  <button
                    onClick={() => openFeatureModal(feature)}
                    style={{
                      background: "#F9FAFB",
                      border: "1px solid #E5E7EB",
                      borderRadius: 6,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {img && (
                      <img src={img} alt={feature.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{
                        background: tagBg, color: accent, fontSize: 8, fontWeight: 700,
                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                        display: "inline-block", alignSelf: "flex-start",
                      }}>{tagLabel}</span>
                      <h3 style={{ fontSize: 11, fontWeight: 700, color: "#0A0E27", margin: 0 }}>{feature.title}</h3>
                      <p style={{ fontSize: 9, color: "#4B5563", lineHeight: 1.5, margin: 0, flex: 1 }}>{feature.description}</p>
                      <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginTop: 4 }}>Learn more ›</div>
                    </div>
                  </button>
                );
              };

              return (
                <div style={{
                  background: "#FFFFFF",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  padding: "28px 32px",
                }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#1A6FD4", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
                      What's included
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0A0E27", marginBottom: 4 }}>
                      Everything you need to pass
                    </h2>
                    <p style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.5, maxWidth: 400, margin: 0 }}>
                      Every course comes with the tools, support and flexibility to get you test-ready — included for free.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <FeaturedCard feature={retest} accent="#D12E2E" tagLabel="Promise" tagBg="#FEE2E2" />
                    <FeaturedCard feature={theory} accent="#1A6FD4" tagLabel="Included free" tagBg="#DBEAFE" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <SmallCard feature={swap} accent="#D12E2E" tagLabel="FREE Feature" tagBg="#FEE2E2" />
                    <SmallCard feature={payments} accent="#1A6FD4" tagLabel="Flexible" tagBg="#DBEAFE" />
                    <SmallCard feature={theoryPro} accent="#1A6FD4" tagLabel="Premium" tagBg="#DBEAFE" />
                  </div>
                </div>
              );
            })()}
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

        </>}
      />

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />


      {/* From Nervous to Road Ready Section — Warm Organic (Mobile unchanged) */}
      <section className="md:hidden bg-gradient-to-b from-orange-50 via-amber-50/40 to-background py-20">
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

      {/* Every Learner's Journey — Desktop DSM redesign */}
      <section className="hidden md:block" style={{ background: "#EFF6FF", padding: "36px 40px", borderRadius: 8 }}>
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="text-center" style={{ marginBottom: 28 }}>
            <div style={{ color: "#1A6FD4", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>
              LEARNER STORIES
            </div>
            <h2 style={{ color: "#0A0E27", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>
              Every Learner's Journey <span style={{ color: "#D12E2E" }}>Starts Here</span>
            </h2>
            <p style={{ color: "#6B7280", fontSize: 12, marginTop: 4 }}>
              From first lesson nerves to passing-day celebrations
            </p>
          </div>

          {/* Three review cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              { name: "Sarah M.", course: "5-Day Intensive", img: testimonialSarahM, text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points.", border: "#D12E2E", avatarBg: "#FEE2E2" },
              { name: "Emily R.", course: "Semi-Intensive", img: testimonialEmily, text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made.", border: "#1A6FD4", avatarBg: "#DBEAFE" },
              { name: "Priya T.", course: "10-Day Course", img: testimonialPriya, text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job.", border: "#0A0E27", avatarBg: "#F3F4F6" },
            ].map((t) => (
              <div
                key={t.name}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderLeft: `4px solid ${t.border}`,
                  borderRadius: 6,
                  padding: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <img
                  src={t.img}
                  alt={t.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: t.avatarBg,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 1 }}>
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} style={{ width: 9, height: 9, color: "#F59E0B", fill: "#F59E0B" }} />
                    ))}
                  </div>
                  <p style={{ color: "#4B5563", fontSize: 10, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
                    "{t.text}"
                  </p>
                  <p style={{ margin: 0, marginTop: 2 }}>
                    <span style={{ color: "#0A0E27", fontSize: 11, fontWeight: 700 }}>{t.name}</span>
                    <span style={{ color: "#6B7280", fontSize: 10, fontWeight: 400 }}> · {t.course}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #BFDBFE",
              borderRadius: 6,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {(() => {
                const statColors = ["#D12E2E", "#1A6FD4", "#0A0E27"];
                const statItems = stats.slice(0, 3);
                return statItems.map((stat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ textAlign: "center", padding: "0 24px" }}>
                      <div style={{ color: statColors[i], fontSize: 20, fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ color: "#6B7280", fontSize: 10, marginTop: 2 }}>{stat.label}</div>
                    </div>
                    {i < statItems.length - 1 && (
                      <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />
                    )}
                  </div>
                ));
              })()}
            </div>
            <Link
              to="/instructors"
              className="d365-start-journey-btn"
              style={{
                background: "#1A6FD4",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 2,
                textDecoration: "none",
                display: "inline-block",
                whiteSpace: "nowrap",
                transition: "background 150ms ease",
              }}
            >
              Start Your Journey →
            </Link>
          </div>
          <style>{`.d365-start-journey-btn:hover{background:#1558A8 !important;}`}</style>
        </div>
      </section>

      {/* Video Story Section — Drive365 Style (Desktop) */}
      <section className="hidden md:block" style={{ background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", padding: "24px 28px", marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
          {/* Left: Video thumbnail */}
          <div className="relative" style={{ borderRadius: 6, overflow: "hidden", height: 180 }}>
            <img src={videoThumbnailImg} alt="Watch our story" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
              disabled={!welcomeVideoUrl}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#D12E2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: welcomeVideoUrl ? "pointer" : "default",
                transition: "transform 150ms, background 150ms",
                border: "none",
                padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#B02020"; e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#D12E2E"; e.currentTarget.style.transform = "translate(-50%, -50%)"; }}
            >
              <span style={{
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "7px 0 7px 12px",
                borderColor: "transparent transparent transparent #fff",
                display: "inline-block",
                marginLeft: 2,
              }} />
            </button>
            <div style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "#FFFFFF",
              color: "#0A0E27",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "3px 10px",
              borderRadius: 20,
            }}>2 MIN WATCH</div>
          </div>

          {/* Right: Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#1A6FD4", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px" }}>OUR STORY</div>
            <h2 style={{ color: "#0A0E27", fontSize: 20, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px", margin: 0 }}>
              Watch how learners pass with <span style={{ color: "#D12E2E" }}>confidence</span>
            </h2>
            <p style={{ color: "#4B5563", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
              Discover why thousands of learners trust us with their driving journey — from first lesson nerves to test day success.
            </p>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {[testimonialSarahFallback, testimonialJamesFallback, testimonialEmmaFallback].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Learner"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #fff",
                      marginLeft: i > 0 ? -6 : 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ color: "#F59E0B", fontSize: 10, letterSpacing: "1px" }}>★★★★★</div>
              <div style={{ color: "#4B5563", fontSize: 10 }}>
                <span style={{ color: "#0A0E27", fontWeight: 700 }}>4.9</span> from 6,499 learner reviews
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                type="button"
                onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                disabled={!welcomeVideoUrl}
                style={{
                  background: "#D12E2E",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "10px 18px",
                  borderRadius: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  border: "none",
                  cursor: welcomeVideoUrl ? "pointer" : "default",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#B02020")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#D12E2E")}
              >
                <span style={{
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "4px 0 4px 8px",
                  borderColor: "transparent transparent transparent #fff",
                  display: "inline-block",
                }} />
                Play Video
              </button>
              <Link
                to="/courses"
                style={{ color: "#1A6FD4", fontSize: 11, fontWeight: 600, padding: "10px 0", textDecoration: "none", transition: "color 150ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#1558A8"; e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#1A6FD4"; e.currentTarget.style.textDecoration = "none"; }}
              >
                Find an Instructor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Story Section — Drive365 Style (Mobile) */}
      <section style={{ background: "#F6F6F8" }} className="md:hidden py-20">
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
                border: "1px solid #E9E5E8",
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
                    <Play className="h-7 w-7 ml-1" style={{ color: "#3E57D9", fill: "#3E57D9" }} />
                  </div>
                </div>
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full"
                  style={{ background: "rgba(255,255,255,0.95)", color: "#3E57D9", letterSpacing: "0.08em" }}
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
                style={{ color: "#3E57D9", letterSpacing: "0.08em" }}
              >
                Our Story
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold mb-5 leading-[1.1]"
                style={{ color: "#191C2F", letterSpacing: -0.5 }}
              >
                Watch how learners pass with confidence
              </h2>
              <p className="text-base md:text-lg mb-7 leading-relaxed" style={{ color: "#2F3748" }}>
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
                  <div className="text-xs font-medium" style={{ color: "#2F3748" }}>
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
                  background: "#3E57D9",
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

      {/* Recruitment Banner — Desktop DSM Redesign */}
      <section className="hidden md:block" style={{ background: "linear-gradient(135deg, #1A6FD4 0%, #0A3A7A 100%)", borderRadius: 8, padding: "24px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "nowrap" }}>
          {/* Left column */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", padding: "4px 12px", borderRadius: 20, marginBottom: 8 }}>
              Now Recruiting
            </div>
            <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
              Are You a Driving Instructor?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, lineHeight: 1.5, maxWidth: 420, margin: 0 }}>
              Join the Drive365 franchise — free private healthcare, £50 bonus every time a pupil passes, and the best tech platform in the business.
            </p>
          </div>

          {/* Middle column */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { dot: "#FFFFFF", text: "Free private healthcare" },
              { dot: "#FFB3C7", text: "£50 bonus every time a pupil passes" },
              { dot: "#B2FCE4", text: "Best tech platform in the business" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>From just</div>
              <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>£25</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>per week</div>
            </div>
            <Link
              to="/drive365/franchise"
              className="d365-recruit-btn"
              style={{
                background: "#FFFFFF",
                color: "#1A6FD4",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 2,
                textDecoration: "none",
                display: "inline-block",
                whiteSpace: "nowrap",
                transition: "background 150ms ease",
              }}
            >
              Learn More →
            </Link>
          </div>
          <style>{`.d365-recruit-btn:hover{background:#F0F7FF !important;}`}</style>
        </div>
      </section>

      {/* Recruitment Banner — Mobile (unchanged) */}
      <section className="md:hidden bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container max-w-4xl text-center space-y-5">
          <Badge className="bg-accent text-accent-foreground text-sm">Now Recruiting</Badge>
          <h2 className="text-2xl md:text-3xl font-bold">Are You a Driving Instructor?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join the Drive365 franchise — free private healthcare, £50 bonus every time a pupil passes,
            and the best tech platform in the business. From just £25/week.
          </p>
          <Button size="lg" variant="secondary" className="text-base px-8" asChild>
            <Link to="/drive365/franchise">
              Learn More <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Latest News & Tips — Mobile (unchanged) */}
      <section className="md:hidden bg-gradient-to-b from-orange-50 to-background py-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-4xl font-black">News & Tips</h2>
            <p className="text-muted-foreground mt-2">Helpful reads for your driving journey</p>
          </motion.div>

          {newsLoading ? (
            <div className="grid gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : dvsaNews.length > 0 ? (
            <div className="grid gap-8">
              {dvsaNews.slice(0, 3).map((article, i) => (
                <Link key={article.slug || article.link} to={`/news/${article.slug}`} className="group block">
                  <div className="rounded-2xl overflow-hidden shadow-md mb-4">
                    <img
                      src={article.imageUrl || (i === 0 ? newsFeatured : i === 1 ? newsArticle1 : newsArticle2)}
                      alt={article.title}
                      className="h-44 w-full object-cover"
                    />
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100 mb-2">
                    {article.category || "DVSA News"}
                  </Badge>
                  <h3 className="font-bold text-lg mb-1">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} • 3 min read
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="text-center mt-10">
            <Link to="/news">
              <Button variant="outline" className="gap-2">
                View All Articles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News & Tips — Desktop DSM redesign */}
      <section className="hidden md:block" style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E5E7EB", padding: "28px 32px" }}>
        <div className="container max-w-5xl" style={{ padding: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ color: "#1A6FD4", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>
                LATEST FROM DRIVE 365
              </div>
              <div style={{ color: "#0A0E27", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
                News & Tips
              </div>
            </div>
            <Link
              to="/news"
              className="d365-news-cta"
              style={{
                background: "transparent",
                border: "1px solid #E5E7EB",
                color: "#0A0E27",
                fontSize: 11,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 2,
                textDecoration: "none",
                display: "inline-block",
                transition: "all 150ms ease",
              }}
            >
              View All Articles →
            </Link>
            <style>{`.d365-news-cta:hover{border-color:#1A6FD4 !important;color:#1A6FD4 !important;}`}</style>
          </div>

          {(() => {
            const fallbackImgs = [newsFeatured, newsArticle1, newsArticle2];
            const fallbackArticles = [
              { title: "Latest DVSA News & Updates", description: "Stay up to date with the latest driving test news.", imageUrl: newsFeatured, slug: "", link: "/news", pubDate: "", category: "DVSA News" },
              { title: "Tips for New Learners", description: "Expert advice to get you started on your journey.", imageUrl: newsArticle1, slug: "", link: "/news", pubDate: "", category: "DVSA News" },
              { title: "Check Back for More", description: "We regularly publish new articles and tips.", imageUrl: newsArticle2, slug: "", link: "/news", pubDate: "", category: "DVSA News" },
            ];
            const articles = (dvsaNews.length > 0 ? dvsaNews.slice(0, 3) : fallbackArticles).map((a, i) => ({
              ...a,
              imageUrl: a.imageUrl || fallbackImgs[i],
            }));
            const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

            if (newsLoading) {
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                  <div style={{ height: 320, background: "#F3F4F6", borderRadius: 6 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ height: 100, background: "#F3F4F6", borderRadius: 6 }} />
                    <div style={{ height: 100, background: "#F3F4F6", borderRadius: 6 }} />
                  </div>
                </div>
              );
            }

            const [featured, ...sidebar] = articles;
            const sidebarColors = [
              { stripe: "#1A6FD4", tagBg: "#DBEAFE", tagColor: "#1A6FD4" },
              { stripe: "#0A0E27", tagBg: "#F3F4F6", tagColor: "#0A0E27" },
            ];

            return (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                {/* Featured */}
                <Link
                  to={featured.slug ? `/news/${featured.slug}` : "/news"}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <article style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                    <img src={featured.imageUrl} alt={featured.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "inline-block", background: "#FEE2E2", color: "#D12E2E", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "2px 7px", borderRadius: 2, alignSelf: "flex-start" }}>
                        {featured.category || "Driving News"}
                      </div>
                      <h3 style={{ color: "#0A0E27", fontSize: 13, fontWeight: 800, lineHeight: 1.35, margin: 0, flex: 1 }}>
                        {featured.title}
                      </h3>
                      <p style={{ color: "#4B5563", fontSize: 10, lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {featured.description}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF", fontSize: 10 }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        {formatDate(featured.pubDate)}{featured.pubDate ? " • " : ""}3 min read
                      </div>
                    </div>
                    <div style={{ height: 3, background: "#D12E2E", width: "100%" }} />
                  </article>
                </Link>

                {/* Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sidebar.map((article, idx) => {
                    const c = sidebarColors[idx];
                    return (
                      <Link
                        key={article.slug || article.link || idx}
                        to={article.slug ? `/news/${article.slug}` : "/news"}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <article style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, overflow: "hidden", display: "grid", gridTemplateColumns: "90px 1fr" }}>
                          <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", minHeight: 80, objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "10px 12px", borderLeft: `3px solid ${c.stripe}`, display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "inline-block", background: c.tagBg, color: c.tagColor, fontSize: 8, fontWeight: 700, textTransform: "uppercase", padding: "2px 6px", borderRadius: 2, alignSelf: "flex-start" }}>
                              {article.category || "Tips"}
                            </div>
                            <h3 style={{ color: "#0A0E27", fontSize: 11, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
                              {article.title}
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF", fontSize: 9 }}>
                              <Clock style={{ width: 9, height: 9 }} />
                              {formatDate(article.pubDate)}{article.pubDate ? " • " : ""}3 min read
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Features Section — Desktop DSM redesign */}
      <section className="hidden md:block" style={{ background: "#F9FAFB", padding: "36px 32px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
        <div className="container max-w-6xl">
          <div className="text-center" style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "inline-block",
                background: "#1A6FD4",
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
                padding: "5px 14px",
                borderRadius: 20,
                marginBottom: 12,
              }}
            >
              All-in-One Platform
            </div>
            <h2 style={{ color: "#0A0E27", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
              Everything You Need to <span style={{ color: "#D12E2E" }}>Learn to Drive</span>
            </h2>
            <p style={{ color: "#6B7280", fontSize: 12, lineHeight: 1.5, maxWidth: 480, margin: "0 auto" }}>
              Our platform connects learners, instructors, and parents in one seamless experience.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              {
                title: "Parent Portal",
                tag: "For Parents",
                tagBg: "#FEE2E2",
                tagColor: "#D12E2E",
                bar: "#D12E2E",
                description: "Stay informed with lesson updates and payment visibility.",
                link: "/parent",
                image: getImage("feature_parent_portal", referFriends)
              },
              {
                title: "Local Instructors",
                tag: "For Learners",
                tagBg: "#DBEAFE",
                tagColor: "#1A6FD4",
                bar: "#1A6FD4",
                description: "Find certified instructors near you by postcode. Search and compare prices 24/7.",
                image: localInstructorImg
              },
              {
                title: "Track Progress",
                tag: "For Everyone",
                tagBg: "#F3F4F6",
                tagColor: "#0A0E27",
                bar: "#0A0E27",
                description: "Monitor your journey with detailed progress reports.",
                image: getImage("feature_progress", featureTheoryFallback)
              },
            ].map((f, i) => {
              const card = (
                <div
                  key={i}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <img
                    src={f.image}
                    alt={f.title}
                    style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        display: "inline-block",
                        background: f.tagBg,
                        color: f.tagColor,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "3px 8px",
                        borderRadius: 2,
                        marginBottom: 6,
                      }}
                    >
                      {f.tag}
                    </div>
                    <div style={{ color: "#0A0E27", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                      {f.title}
                    </div>
                    <p style={{ color: "#4B5563", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                      {f.description}
                    </p>
                  </div>
                  <div style={{ height: 4, background: f.bar, width: "100%" }} />
                </div>
              );
              return f.link ? <Link key={i} to={f.link}>{card}</Link> : <div key={i}>{card}</div>;
            })}
          </div>
        </div>
      </section>

      {/* Features Section — Mobile (unchanged) */}
      <section className="md:hidden bg-background py-24">
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

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Parent Portal",
                description: "Stay informed with lesson updates and payment visibility.",
                link: "/parent",
                image: getImage("feature_parent_portal", referFriends)
              },
              {
                title: "Local Instructors",
                description: "Find certified instructors near you by postcode. Search and compare prices 24/7.",
                image: localInstructorImg
              },
              {
                title: "Track Progress",
                description: "Monitor your journey with detailed progress reports.",
                image: getImage("feature_progress", featureTheoryFallback)
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



      {/* Desktop Trust Badges — DSM Redesign */}
      <section className="hidden md:block" style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {/* Top row — Accreditations */}
        <div
          style={{
            padding: "14px 32px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
          }}
        >
          {[
            { logo: logoAdiCode, alt: "ADI Code of Practice", tick: "#D12E2E" },
            { logo: logoMsa, alt: "MSA GB - For all driver trainers", tick: "#1A6FD4" },
            { logo: logoCpd, alt: "Continuing Professional Development", tick: "#0A0E27" },
          ].map((item, i, arr) => (
            <div key={item.alt} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: item.tick,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  ✓
                </div>
                <img src={item.logo} alt={item.alt} style={{ maxHeight: 32, width: "auto", objectFit: "contain", display: "block" }} />
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 1, height: 28, background: "#F3F4F6", marginLeft: 32, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {/* Bottom row — Payments */}
        <div
          style={{
            padding: "12px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 500 }}>Pay with</span>
          {[
            { src: logoCardPayments, alt: "Visa, MasterCard, Maestro, JCB" },
            { src: logoKlarna, alt: "Klarna" },
            { src: logoClearpay, alt: "Clearpay" },
          ].map((logo) => (
            <div
              key={logo.alt}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 4,
                padding: "4px 10px",
              }}
            >
              <img src={logo.src} alt={logo.alt} style={{ maxHeight: 20, width: "auto", objectFit: "contain", display: "block" }} />
            </div>
          ))}
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
