import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ArrowLeftRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, ChevronDown, Loader2, Timer, CalendarCheck, Shield, Scale, Lock, IdCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import Drive365Home from "@/components/home/Drive365Home";
import HomepageExtraSections from "@/components/home/HomepageExtraSections";
import { Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { IOSCourseCard } from "@/components/IOSCourseCard";
import { Badge } from "@/components/ui/badge";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { CoursePlannerSheet } from "@/components/course-planner/CoursePlannerSheet";
import { HeroSearchSection } from "@/components/homepage/HeroSearchSection";
import { FeaturedInstructors } from "@/components/homepage/FeaturedInstructors";
import { HomeFAQ } from "@/components/homepage/HomeFAQ";


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
import featureRetestFallback from "@/assets/feature-retest.jpg";
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
        logo: "https://everydriver.lovable.app/everydriver-logo-full.png",
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
  // Force pass-themed asset for FREE Re-Test — DB image was the old FAIL certificate
  const featureRetest = featureRetestFallback;
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
        afterHero={
          <>
          {/* Why book through Every Driver — desktop only */}
          <section className="hidden md:block" style={{ padding: "0 0 20px" }}>
            <div className="mt-0" style={{ background: "#EEF4FB", borderRadius: 0, padding: "1.25rem", fontFamily: "'Poppins', sans-serif" }}>
              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1936", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
                  Why book through Every Driver?
                </h2>
                <div style={{ width: 36, height: 3, borderRadius: 2, background: "#0070C0", margin: "0 auto" }} />
              </div>

              {/* 2-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, maxWidth: 1100, margin: "0 auto" }}>
                {/* Card 1 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#D12E2E", fontSize: 14, fontWeight: 700 }}>↺</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Free re-test if you don't pass</div>
                    <div className="font-medium" style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>We will pay for your retest*</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CalendarCheck className="h-4 w-4 text-[#3B6D11]" />
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Book Direct 24/7</div>
                    <div style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>24/7 online booking</div>
                  </div>
                </div>

                {/* Card 3 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#3B6D11", fontSize: 14 }}>✓</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Every instructor DBS checked</div>
                    <div style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>DVSA approved and checked by us.</div>
                  </div>
                </div>

                {/* Card 4 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#3B6D11", fontSize: 14 }}>★</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Real ratings before you book</div>
                    <div style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>Real reviews from genuine pupils.</div>
                  </div>
                </div>

                {/* Card 5 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#3B6D11", fontSize: 14 }}>🔒</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Your money is protected</div>
                    <div style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>Secure payment · dispute resolution</div>
                  </div>
                </div>

                {/* Card 6 */}
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#3B6D11", fontSize: 14 }}>📱</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0A1936", marginBottom: 1, lineHeight: 1.3 }}>Free Pupil and Parent app</div>
                    <div style={{ fontSize: 11, color: "#5A6B82", lineHeight: 1.4 }}>Book, reschedule and track progress</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          </>
        }




        afterLearningPaths={<>
          {/* Video section — now placed after Choose Your Route */}
          <section className="hidden md:block" style={{ background: "#F6F6F8", padding: "32px 5%" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 14, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                <button
                  type="button"
                  onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                  disabled={!welcomeVideoUrl}
                  style={{
                    background: videoThumbnailImg ? `url(${videoThumbnailImg}) center/cover no-repeat` : "linear-gradient(135deg, #0A2B6B, #0A1628)",
                    minHeight: 220,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    padding: 0,
                    cursor: welcomeVideoUrl ? "pointer" : "default",
                  }}
                  aria-label="Play our story video"
                >
                  {videoThumbnailImg && (
                    <span style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.35)", borderRadius: "inherit" }} />
                  )}
                  <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", color: "#FFFFFF", fontSize: 9, fontWeight: 700, padding: "4px 10px", borderRadius: 20, zIndex: 1 }}>
                    2 MIN WATCH
                  </span>
                  <div style={{ width: 52, height: 52, borderRadius: 999, background: "#E8641A", boxShadow: "0 4px 20px rgba(232,100,26,0.4)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", zIndex: 1 }}>
                    ▶
                  </div>
                </button>
                <div style={{ background: "#FFFFFF", padding: 28 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: "1.5px" }}>OUR STORY</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", margin: "6px 0" }}>
                    Watch how learners pass with <span style={{ color: "#E8641A" }}>confidence.</span>
                  </h3>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>
                    Discover why thousands of learners trust us with their driving journey.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ display: "flex" }}>
                      {[
                        { l: "S", bg: "#0A2B6B" },
                        { l: "J", bg: "#E8641A" },
                        { l: "E", bg: "#0070C0" },
                        { l: "P", bg: "#10B981" },
                      ].map((a, i) => (
                        <div key={i} style={{ width: 24, height: 24, borderRadius: 999, background: a.bg, color: "#FFFFFF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i === 0 ? 0 : -8, border: "2px solid #FFFFFF" }}>
                          {a.l}
                        </div>
                      ))}
                    </div>
                    <span style={{ color: "#FBBF24", fontSize: 12 }}>★★★★★</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>4.9 from 6,499 learner reviews</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                      disabled={!welcomeVideoUrl}
                      style={{ background: "#E8641A", color: "#FFFFFF", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, border: "none", cursor: welcomeVideoUrl ? "pointer" : "default" }}
                    >
                      ▶ Play video
                    </button>
                    <Link to="/instructors" style={{ background: "#FFFFFF", color: "#0070C0", border: "1.5px solid #0070C0", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Find an instructor →</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Backed by EveryDriver — trust grid (desktop) */}
          <section className="hidden md:block" style={{ padding: "48px 5%", background: "#FFFFFF", position: "relative", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
            {/* soft brand backdrop */}
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 380px at 50% -80px, rgba(0,112,192,0.06), transparent 60%), radial-gradient(560px 280px at 90% 110%, rgba(209,46,46,0.04), transparent 60%)", pointerEvents: "none" }} />
            <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
              {/* Header */}
              <div style={{ marginBottom: 28, maxWidth: 600, textAlign: "center", marginInline: "auto" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "4px 10px 4px 6px", borderRadius: 999, background: "#F2F6FB", border: "1px solid #E1EAF4" }}>
                  <span style={{ background: "#0F2044", padding: 4, borderRadius: 999, display: "inline-flex" }}>
                    <ShieldCheck style={{ width: 11, height: 11, color: "#fff" }} />
                  </span>
                  <span style={{ color: "#0F2044", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Backed by EveryDriver
                  </span>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0F2044", letterSpacing: "-0.6px", margin: "0 0 8px", lineHeight: 1.12 }}>
                  Your journey, <span style={{ color: "#D12E2E" }}>protected</span> at every turn.
                </h2>
                <p style={{ fontSize: 13.5, color: "#5A6B82", lineHeight: 1.6, margin: 0 }}>
                  Search vetted instructors in your area, compare reviews, prices and live availability, then book online 24/7 — all backed by EveryDriver.
                </p>
              </div>

              {/* Stepper */}
              <div style={{ position: "relative", marginBottom: 32, maxWidth: 640, marginInline: "auto" }}>
                <div aria-hidden style={{ position: "absolute", top: 22, left: "14%", right: "14%", height: 2, background: "linear-gradient(90deg, #0070C0 0%, #0F2044 50%, #D12E2E 100%)", borderRadius: 999, opacity: 0.18 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, position: "relative" }}>
                  {[
                    { Icon: Search, label: "Search", desc: "Find instructors near you", color: "#0070C0" },
                    { Icon: ArrowLeftRight, label: "Compare", desc: "Reviews, prices & availability", color: "#0F2044" },
                    { Icon: CalendarCheck, label: "Book Direct 24/7", desc: "24/7 online checkout", color: "#D12E2E" },
                  ].map(({ Icon, label, desc, color }, i) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: `1.5px solid ${color}`, boxShadow: `0 6px 16px -8px ${color}55, 0 0 0 5px #fff`, position: "relative" }}>
                        <Icon style={{ width: 18, height: 18, color }} strokeWidth={2.2} />
                        <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: color, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                      </div>
                      <div className="font-bold" style={{ fontSize: 13, fontWeight: 700, color: "#0F2044", letterSpacing: "-0.15px" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#6B7B92", marginTop: 2 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust card grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { Icon: CheckCircle2, color: "#0070C0", title: "Checked & monitored", body: "All instructors are checked and verified before joining and continuously monitored. All instructors abide by the DVSA Code of Conduct." },
                  { Icon: IdCard, color: "#0F2044", title: "Enhanced DBS", body: "Highest level background check — includes children's and adults' barred lists for total peace of mind." },
                  { Icon: Scale, color: "#0070C0", title: "Dispute resolution", body: "We step in and resolve issues fairly between you and your instructor, ensuring a smooth experience." },
                  { Icon: Lock, color: "#0F2044", title: "Your money is safe", body: "Funds held securely until your booking is confirmed. No instructor gets paid until you're booked in." },
                ].map(({ Icon, color, title, body }) => (
                  <div
                    key={title}
                    style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1.5px solid #E8EDF2", transition: "transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 14px 32px -18px ${color}40`; e.currentTarget.style.borderColor = `${color}55`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E8EDF2"; }}
                  >
                    <div style={{ width: 36, height: 36, background: `${color}12`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Icon style={{ width: 18, height: 18, color }} strokeWidth={2} />
                    </div>
                    <h3 className="font-bold" style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2044", margin: "0 0 6px", letterSpacing: "-0.15px" }}>{title}</h3>
                    <p style={{ fontSize: 12, color: "#5A6B82", lineHeight: 1.55, margin: 0 }}>{body}</p>
                  </div>
                ))}
              </div>
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
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#D12E2E]">
                    Available now
                  </div>
                  <h2 className="text-xl font-medium md:text-2xl text-foreground">Featured Courses</h2>
                </div>

                <Link to="/courses" className="hidden items-center gap-1 text-sm font-medium text-[#0070C0] hover:underline sm:inline-flex">
                  View all courses
                  <ArrowRight className="h-4 w-4" />
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
          <FeaturedInstructors />
          <HomeFAQ />

          <HomepageExtraSections />

        </>}
      />

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

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />








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


      {/* Latest from Every Driver — Desktop */}
      <section className="hidden md:block" style={{ fontFamily: "'Poppins', sans-serif", background: "#FFFFFF", padding: "48px 32px" }}>
        <div className="container max-w-6xl">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ color: "#D12E2E", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Latest from Every Driver
              </div>
              <h2 style={{ color: "#0A1936", fontSize: 20, fontWeight: 500, margin: 0, lineHeight: 1.3 }}>
                News & tips.
              </h2>
            </div>
            <Link to="/news" style={{ fontSize: 13, fontWeight: 500, color: "#0070C0", textDecoration: "none" }}>
              View all articles →
            </Link>
          </div>

          {newsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
              <div className="animate-pulse" style={{ background: "#f3f4f6", borderRadius: 12, height: 320 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="animate-pulse" style={{ background: "#f3f4f6", borderRadius: 12, flex: 1 }} />
                <div className="animate-pulse" style={{ background: "#f3f4f6", borderRadius: 12, flex: 1 }} />
              </div>
            </div>
          ) : dvsaNews.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
              {/* Feature card */}
              {(() => {
                const article = dvsaNews[0];
                const img = article.imageUrl || newsFeatured;
                return (
                  <Link to={`/news/${article.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                      <div style={{ width: "100%", height: 160, minHeight: 160, maxHeight: 160, overflow: "hidden", flexShrink: 0 }}>
                        <img src={img} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ color: "#D12E2E", fontSize: 10, fontWeight: 500, textTransform: "uppercase", marginBottom: 6 }}>
                          {article.category || "DVSA News"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#0A1936", lineHeight: 1.5, marginBottom: 8 }}>
                          {article.title}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: 11, marginTop: "auto" }}>
                          {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} • 3 min read
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* Small cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dvsaNews.slice(1, 3).map((article, i) => {
                  const img = article.imageUrl || (i === 0 ? newsArticle1 : newsArticle2);
                  return (
                    <Link key={article.slug || article.link} to={`/news/${article.slug}`} style={{ textDecoration: "none", flex: 1 }}>
                      <div style={{ background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", height: "100%" }}>
                        <div style={{ width: 90, minWidth: 90, maxWidth: 90, flexShrink: 0, overflow: "hidden" }}>
                          <img src={img} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                        <div style={{ padding: "0.75rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ color: "#D12E2E", fontSize: 10, fontWeight: 500, textTransform: "uppercase", marginBottom: 4 }}>
                            {article.category || "DVSA News"}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#0A1936", lineHeight: 1.4, marginBottom: 6 }}>
                            {article.title}
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: 11 }}>
                            {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} • 3 min read
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
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


      {/* Features Section — Desktop DSM redesign */}
      <section className="hidden md:block" style={{ background: "#F9FAFB", padding: "36px 32px", borderRadius: 8, border: "1px solid #E5E7EB", fontFamily: "'Poppins', sans-serif" }}>
        <div className="container max-w-6xl">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: "#D12E2E", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              All-in-one platform
            </div>
            <h2 style={{ color: "#0A1936", fontSize: 20, fontWeight: 500, margin: "0 0 8px", lineHeight: 1.3 }}>
              Everything you need to learn to drive.
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Every Driver connects pupils, instructors, and parents in one seamless experience.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {/* Card 1 — Parents */}
            <div style={{ background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <img
                src={getImage("feature_parent_portal", referFriends)}
                alt="Parent portal"
                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", background: "#FEF3EA", color: "#7A3500", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, border: "1px solid #f9c49a", marginBottom: 10, alignSelf: "flex-start" }}>
                  For parents
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0A1936", marginBottom: 6 }}>
                  Parent portal
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 12px" }}>
                  Stay informed with lesson updates, progress reports, and full payment visibility — all in one place.
                </p>
                <Link to="/parent" style={{ fontSize: 13, fontWeight: 500, color: "#0070C0", textDecoration: "none", marginTop: "auto" }}>
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Card 2 — Learners */}
            <div style={{ background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <img
                src={localInstructorImg}
                alt="Local instructors"
                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", background: "#EEF4FB", color: "#0A2B6B", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, border: "1px solid #bfd4ee", marginBottom: 10, alignSelf: "flex-start" }}>
                  For learners
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0A1936", marginBottom: 6 }}>
                  Local instructors
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 12px" }}>
                  Find vetted, reviewed instructors near you by postcode. Compare pass rates, prices, and availability — 24/7.
                </p>
                <Link to="/instructors" style={{ fontSize: 13, fontWeight: 500, color: "#0070C0", textDecoration: "none", marginTop: "auto" }}>
                  Find an instructor →
                </Link>
              </div>
            </div>

            {/* Card 3 — Everyone */}
            <div style={{ background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <img
                src={getImage("feature_progress", featureTheoryFallback)}
                alt="Track progress"
                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", background: "#EAF3DE", color: "#3B6D11", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, border: "1px solid #c0dd97", marginBottom: 10, alignSelf: "flex-start" }}>
                  For everyone
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0A1936", marginBottom: 6 }}>
                  Track progress
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 12px" }}>
                  Monitor your journey with detailed progress reports, lesson history, and test readiness indicators.
                </p>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#0070C0", textDecoration: "none", marginTop: "auto", cursor: "pointer" }}>
                  See how it works →
                </span>
              </div>
            </div>
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



      {/* Desktop Trust Badges */}
      <section className="hidden md:block" style={{ fontFamily: "'Poppins', sans-serif", background: "#FFFFFF", borderRadius: 8, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {/* Top row — Accreditations */}
        <div style={{ padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {[
            { logo: logoAdiCode, alt: "ADI Code of Practice", name: "ADI Code of Practice" },
            { logo: logoMsa, alt: "MSA GB - For all driver trainers", name: "MSA GB" },
            { logo: logoCpd, alt: "Continuing Professional Development", name: "Continuing Professional Development" },
          ].map((item, i, arr) => (
            <div key={item.alt} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={12} color="#1A7D4E" strokeWidth={3} />
                </div>
                <img src={item.logo} alt={item.alt} style={{ maxHeight: 32, width: "auto", objectFit: "contain", display: "block" }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "#0A1936", whiteSpace: "nowrap" }}>{item.name}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 1, height: 28, background: "#e5e7eb", margin: "0 32px", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ height: 0.5, background: "#e5e7eb", width: "100%" }} />

        {/* Bottom row — Payments */}
        <div style={{ padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 400, marginRight: 4 }}>Pay with</span>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "5px 12px" }}>
            <img src={logoCardPayments} alt="Visa, MasterCard, Maestro, JCB" style={{ maxHeight: 20, width: "auto", objectFit: "contain", display: "block" }} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#FFB3C7", border: "0.5px solid #FFB3C7", borderRadius: 8, padding: "5px 12px" }}>
            <img src={logoKlarna} alt="Klarna" style={{ maxHeight: 20, width: "auto", objectFit: "contain", display: "block" }} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#B2FCE4", border: "0.5px solid #B2FCE4", borderRadius: 8, padding: "5px 12px" }}>
            <img src={logoClearpay} alt="Clearpay" style={{ maxHeight: 20, width: "auto", objectFit: "contain", display: "block" }} />
          </div>
        </div>
      </section>

      <CoursePlannerSheet
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        mode="public"
        source="everydriver"
      />
    </MainLayout>
  );
}
