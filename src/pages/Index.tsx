import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, Headphones, ChevronDown, Loader2, Timer, CalendarCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
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
      <Drive365Home />
      <CoursePlannerSheet
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        mode="public"
        source="drive365"
      />
    </MainLayout>
  );
}
