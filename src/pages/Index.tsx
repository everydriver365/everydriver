import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, Headphones, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { Badge } from "@/components/ui/badge";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
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
import testimonialJamesFallback from "@/assets/testimonial-james.jpg";
import testimonialEmmaFallback from "@/assets/testimonial-emma.jpg";
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
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoKlarna from "@/assets/logo-klarna.png";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import logoAdiCode from "@/assets/logo-adi-code.jpg";
import logoMsa from "@/assets/logo-msa.jpg";
import logoCpd from "@/assets/logo-cpd.jpg";
import logoCardPayments from "@/assets/logo-card-payments.png";
import heroMobile from "@/assets/hero-mobile.png";
// Features, stats, testimonials, and hero content are now loaded dynamically via hooks

export default function Index() {
  const isMobile = useIsMobile();
  const [postcode, setPostcode] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<FeatureData | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { getImage, getAlt } = useSiteImages();
  const { courses: featuredCourses, loading: featuredLoading } = useFeaturedCourses(3);
  const { news: dvsaNews, loading: newsLoading } = useDVSANews();
  const { features } = useHomepageFeatures();
  const { hero } = useHomepageHero();
  const { featuredTestimonials, testimonials } = useHomepageTestimonials();
  const { features: includedFeatures } = useIncludedFeatures();
  const { stats } = useHomepageStats();
  const { data: upsells } = useBookingUpsells();
  const earlierTestUpsell = upsells?.find(u => u.name.toLowerCase().includes('earlier test'));

  // Show mobile-optimized layout on mobile devices
  if (isMobile) {
    return (
      <>
        <SEOHead />
        <MobileHomepage />
      </>
    );
  }

  // Helper to open feature modal - accepts both FeatureData and IncludedFeatureData
  const openFeatureModal = (feature: FeatureData | IncludedFeatureData) => {
    setSelectedFeature(feature as FeatureData);
    setFeatureModalOpen(true);
  };
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
      <SEOHead />
      {/* Hero Section - Matching Reference Design */}
      <section className="relative min-h-[600px] overflow-hidden bg-white py-12 lg:py-20">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              {/* Free Re-test Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
                  Free Re-test
                </span>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                <span className="text-primary">Your Driving</span>
                <br />
                <span className="text-primary">Success </span>
                <span className="text-emerald-500">Story</span>
                <br />
                <span className="text-primary">Starts Here</span>
              </h1>
              
              {/* Subtext */}
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster.
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3">
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={setPostcode}
                  placeholder="Enter postcode..."
                  className="flex-1"
                  inputClassName="h-14 rounded-xl border-2 border-border bg-white text-base"
                />
                <Button type="submit" size="lg" className="h-14 rounded-xl px-8 text-base font-semibold">
                  Find Courses
                </Button>
              </form>
              
              {/* Social Proof Row */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 font-semibold text-foreground">4.9</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#ffb3c7] px-2 py-1 text-xs font-bold text-black">Klarna.</span>
                  <span className="rounded-md bg-[#b2fce4] px-2 py-1 text-xs font-bold text-black">clearpay</span>
                  <span className="rounded-md bg-[#ffd700] px-2 py-1 text-xs font-bold text-black">iDeal</span>
                  <span className="text-sm text-muted-foreground">0% Finance</span>
                </div>
              </div>
            </motion.div>

            {/* Mobile Hero Image - Only visible on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:hidden mt-8"
            >
              <img 
                src={heroMobile} 
                alt="Happy learner driver" 
                className="w-full max-w-sm mx-auto rounded-2xl shadow-lg"
              />
            </motion.div>
            
            {/* Right Content - Scattered Polaroid Collage */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[480px] lg:h-[540px] hidden md:block"
            >
              
              {/* Sarah - Top Left Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -12 }}
                animate={{ opacity: 1, y: 0, rotate: -12 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute top-0 left-0 lg:left-4 bg-white p-2 rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] z-10"
              >
                <div className="relative w-40 lg:w-48">
                  <img 
                    src={testimonialSarah} 
                    alt="Sarah" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Sarah</div>
                    <div className="text-muted-foreground text-xs">Passed 1st time! ✨</div>
                  </div>
                </div>
              </motion.div>
              
              {/* James - Top Right Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 8 }}
                animate={{ opacity: 1, y: 0, rotate: 8 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute -top-4 right-24 lg:right-32 bg-white p-2 rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] z-20"
              >
                <div className="relative w-36 lg:w-44">
                  <img 
                    src={testimonialJames} 
                    alt="James" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">James</div>
                    <div className="text-muted-foreground text-xs">Intensive Course 🚗</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Emma - Bottom Center Polaroid (in front) */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -4 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute bottom-0 left-16 lg:left-20 bg-white p-2 rounded-sm shadow-[0_15px_50px_-10px_rgba(0,0,0,0.35)] z-30"
              >
                <div className="relative w-44 lg:w-52">
                  <img 
                    src={testimonialEmma} 
                    alt="Emma" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Emma</div>
                    <div className="text-muted-foreground text-xs">Weekly Lessons 💪</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Priya - Bottom Right Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 10 }}
                animate={{ opacity: 1, y: 0, rotate: 10 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute bottom-16 right-8 lg:right-12 bg-white p-2 rounded-sm shadow-[0_12px_45px_-10px_rgba(0,0,0,0.32)] z-25"
              >
                <div className="relative w-32 lg:w-40">
                  <img 
                    src={testimonialPriya} 
                    alt="Priya"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Priya</div>
                    <div className="text-muted-foreground text-xs">Semi-Intensive 🎉</div>
                  </div>
                </div>
              </motion.div>
              
              {/* 10k+ Learners Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 6 }}
                animate={{ opacity: 1, scale: 1, rotate: 6 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="absolute bottom-0 right-0 lg:right-0 bg-primary text-primary-foreground rounded-xl px-4 py-3 shadow-xl z-40"
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 fill-current" />
                  <div>
                    <div className="font-bold">10k+ Learners</div>
                    <div className="text-sm opacity-80">And counting!</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guaranteed Earlier Test Promotion Banner */}
      <section className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-y border-emerald-200 dark:border-emerald-800">
        <div className="container py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Guaranteed Earlier Test Date</h3>
                <p className="text-sm text-muted-foreground">We'll find you an earlier slot or your money back!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0">
                Only £{earlierTestUpsell?.price?.toFixed(2) ?? '49.99'}
              </Badge>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href="/courses">Book Now</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Choose Your Learning Path Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Find Your Perfect Fit
            </Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
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
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl"
              style={{ backgroundColor: "#e9f4f9" }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseIntensiveImg}
                  alt="Intensive Courses"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-primary text-primary-foreground gap-1">
                  <Zap className="h-3 w-3" />
                  Fast Track
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Intensive Courses</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Full immersion driving experience. Learn everything in concentrated sessions and pass your test in record time.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>30-40 hours</strong> of lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Pass in <strong>1-2 weeks</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Test booking <strong>included</strong></span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£1,299</div>
                  </div>
                  <Link to="/courses?type=intensive">
                    <Button className="gap-2">
                      View Courses
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl"
              style={{ backgroundColor: "#e9f4f9" }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseSemiIntensiveImg}
                  alt="Semi-Intensive Courses"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                  <Star className="h-3 w-3" />
                  Popular
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Semi-Intensive</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practice between sessions.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>30 hours</strong> of lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Pass in <strong>2-4 weeks</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span><strong>Flexible</strong> scheduling</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£999</div>
                  </div>
                  <Link to="/courses?type=semi-intensive">
                    <Button className="gap-2">
                      View Courses
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
              className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl"
              style={{ backgroundColor: "#e9f4f9" }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseWeeklyImg}
                  alt="Weekly Lessons"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-blue-500 text-white gap-1">
                  <Heart className="h-3 w-3" />
                  Flexible
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Weekly Lessons</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>1-2 hours</strong> per week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span><strong>Pay as you go</strong> or packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span><strong>Same instructor</strong> every week</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£35<span className="text-sm font-normal text-muted-foreground">/hour</span></div>
                  </div>
                  <Link to="/courses?type=weekly">
                    <Button className="gap-2">
                      View Lessons
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="bg-background py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Why Learners Love Us
            </Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              What's Included With Every Course
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
              Everything you need to pass your driving test, all included for free.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {includedFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              // Use CMS image or fallback to local assets
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
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                  viewport={{ once: true }}
                  className="group overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-xl cursor-pointer"
                  onClick={() => openFeatureModal(feature)}
                >
                  <div className="relative h-40 overflow-hidden">
                    {featureImage ? (
                      <img 
                        src={featureImage} 
                        alt={feature.title} 
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <IconComponent className="h-16 w-16 text-primary/40 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-bold text-primary">{feature.title}</h3>
                      <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <button className="mt-3 text-sm text-primary hover:underline">Tap for more info</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />

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
              // Loading state
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[340px] animate-pulse rounded-xl bg-muted" />
                ))}
              </>
            ) : featuredCourses.length > 0 ? (
              // Live courses
              featuredCourses.map((course, index) => (
                <motion.div
                  key={`${course.instructor.id}-${course.hours}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <DynamicCourseCard
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
              // No courses available
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

      {/* From Nervous to Road Ready Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 gap-1 border-0 bg-emerald-500 text-white hover:bg-emerald-500">
                <Award className="h-3 w-3" />
                Proven Results
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                From Nervous to<br />
                <span className="italic text-primary">Road Ready</span>
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of learners who transformed their driving fears into confidence.
              </p>

              {/* Stats */}
              <div className="mb-8 flex flex-wrap gap-6">
                {stats.slice(0, 3).map((stat, index) => (
                  <div key={index} className="rounded-xl border bg-card px-6 py-4 text-center shadow-sm">
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link to="/courses">
                <Button className="gap-2">
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Right Content - Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {/* Testimonial 1 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialSarahM}
                    alt="Sarah M."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Sarah M.</span>
                      <span className="text-muted-foreground"> • 5-Day Intensive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialEmily}
                    alt="Emily R."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Emily R.</span>
                      <span className="text-muted-foreground"> • Semi-Intensive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialPriya}
                    alt="Priya T."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Priya T.</span>
                      <span className="text-muted-foreground"> • 10-Day Course</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Story Section */}
      <section className="bg-amber-50/60 py-16">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Video Thumbnail */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={videoThumbnailImg}
                  alt="Our Story Video"
                  className="h-full w-full object-cover"
                />
                {/* Play Button Overlay */}
                <button 
                  onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30 cursor-pointer"
                  disabled={!welcomeVideoUrl}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110">
                    <Play className="h-6 w-6 fill-primary text-primary ml-1" />
                  </div>
                </button>
              </div>
              <p className="mt-4 text-center italic text-muted-foreground">
                Our Story - Watch Now!
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 gap-1 border-0 bg-amber-500 text-white hover:bg-amber-500">
                <Play className="h-3 w-3 fill-white" />
                Watch Our Story
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Every Driver Has a Story
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                From nervous first-timers to confident road users, we've been part of thousands of driving journeys. Watch our intro to see what makes us different.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                  className="gap-2 bg-amber-500 hover:bg-amber-600"
                  disabled={!welcomeVideoUrl}
                >
                  <Play className="h-4 w-4 fill-white" />
                  Play Video
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>
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

      {/* Latest News Section */}
      <section className="bg-background py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">Latest News & Tips</h2>
            <a href="https://despatch.blog.gov.uk/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="hidden gap-2 sm:flex">
                View All Articles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>

          {newsLoading ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-96 animate-pulse rounded-2xl bg-muted" />
              <div className="flex flex-col gap-6">
                <div className="h-32 animate-pulse rounded-xl bg-muted" />
                <div className="h-32 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ) : dvsaNews.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Featured Article */}
              <motion.a
                href={dvsaNews[0].link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={dvsaNews[0].imageUrl || newsFeatured}
                  alt={dvsaNews[0].title}
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-96"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
                    {dvsaNews[0].category || "DVSA News"}
                  </Badge>
                  <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
                    {dvsaNews[0].title}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-2">
                    {dvsaNews[0].description}
                  </p>
                </div>
              </motion.a>

              {/* Side Articles */}
              <div className="flex flex-col gap-6">
                {dvsaNews.slice(1, 3).map((article, index) => (
                  <motion.a
                    key={article.link}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="group flex gap-4 rounded-xl bg-card p-4 shadow-md transition-shadow hover:shadow-lg"
                  >
                    <img
                      src={article.imageUrl || (index === 0 ? newsArticle1 : newsArticle2)}
                      alt={article.title}
                      className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-col justify-center min-w-0">
                      <Badge className="mb-1 w-fit border-0 bg-primary/10 text-primary text-xs">
                        {article.category || "DVSA News"}
                      </Badge>
                      <h4 className="mb-1 font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </motion.a>
                ))}

                {/* Read More Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <a href="https://despatch.blog.gov.uk/" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2">
                      Read More Articles
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </motion.div>
              </div>
            </div>
          ) : (
            // Fallback to static content
            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={newsFeatured}
                  alt="Road safety news"
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-96"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
                    Driving News
                  </Badge>
                  <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
                    Latest DVSA News & Updates
                  </h3>
                  <p className="text-sm text-white/80">
                    Stay up to date with the latest driving test news and instructor updates from DVSA.
                  </p>
                </div>
              </motion.div>
              <div className="flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="group flex gap-4 rounded-xl bg-card p-4 shadow-md"
                >
                  <img src={newsArticle1} alt="News" className="h-24 w-24 rounded-lg object-cover" />
                  <div className="flex flex-col justify-center">
                    <Badge className="mb-1 w-fit border-0 bg-primary/10 text-primary text-xs">DVSA News</Badge>
                    <h4 className="mb-1 font-semibold">Check back for the latest updates</h4>
                  </div>
                </motion.div>
                <a href="https://despatch.blog.gov.uk/" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2">
                    Visit DVSA Blog
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-12">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-card p-6 shadow-lg md:grid-cols-4 md:gap-8 md:p-8">
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

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-4 text-3xl font-bold md:text-4xl"
          >
            Everything You Need to
            <span className="text-accent"> Learn to Drive</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground"
          >
            Our platform connects learners, instructors, and parents in one seamless experience.
          </motion.p>
        </div>

        {/* First Row - Portals */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {/* Pupil Portal */}
          <Link to="/pupil/login">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              viewport={{ once: true }}
              className="group rounded-2xl border p-6 transition-all hover:border-accent/50 hover:shadow-lg cursor-pointer h-full"
              style={{ backgroundColor: "#e9f4f9" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <User className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Pupil Portal</h3>
              <p className="text-sm text-muted-foreground">Track lessons, view progress, and manage payments all in one place.</p>
            </motion.div>
          </Link>

          {/* Parent Portal */}
          <Link to="/parent">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group rounded-2xl border p-6 transition-all hover:border-accent/50 hover:shadow-lg cursor-pointer h-full"
              style={{ backgroundColor: "#e9f4f9" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Parent Portal</h3>
              <p className="text-sm text-muted-foreground">Stay informed with lesson updates, progress reports, and payment visibility.</p>
            </motion.div>
          </Link>
        </div>

        {/* Second Row - Features (exactly 3: Live Availability, Local Instructors, Track Progress) */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Live Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="group rounded-2xl border p-6 transition-all hover:border-accent/50 hover:shadow-lg"
            style={{ backgroundColor: "#e9f4f9" }}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold">Live Availability</h3>
            <p className="text-sm text-muted-foreground">Real-time calendar sync shows you exactly when instructors are free to book.</p>
          </motion.div>

          {/* Local Instructors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="group rounded-2xl border p-6 transition-all hover:border-accent/50 hover:shadow-lg"
            style={{ backgroundColor: "#e9f4f9" }}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold">Local Instructors</h3>
            <p className="text-sm text-muted-foreground">Find certified instructors near you by postcode with adjustable search radius.</p>
          </motion.div>

          {/* Track Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="group rounded-2xl border p-6 transition-all hover:border-accent/50 hover:shadow-lg"
            style={{ backgroundColor: "#e9f4f9" }}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold">Track Progress</h3>
            <p className="text-sm text-muted-foreground">Monitor your learning journey with detailed progress reports and skill assessments.</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-secondary/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-4 text-3xl font-bold md:text-4xl"
            >
              Trusted by Thousands of
              <span className="text-accent"> Happy Drivers</span>
            </motion.h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.filter(t => !t.is_featured).slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-card p-6 shadow-md"
              >
                <p className="mb-4 text-muted-foreground">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  {testimonial.photo_url ? (
                    <img 
                      src={testimonial.photo_url} 
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {testimonial.avatar_initials || testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-3xl gradient-hero p-8 text-center md:p-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of learners who have passed their test with DriveTime. 
            Book your first lesson today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/courses">
              <Button variant="hero" size="xl">
                Find a Lesson
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="heroOutline" size="xl">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Trust Badges Section - Mobile: Text badges, Desktop: Logo images */}
      
      {/* Mobile Trust Badges */}
      <section className="md:hidden border-t bg-muted/30 py-4">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              ADI Code of Practice ✓
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              MSA GB Member
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              CPD Certified
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Visa / Mastercard
            </Badge>
            <Badge className="text-xs bg-[#ffb3c7] text-black border-0">
              Klarna
            </Badge>
            <Badge className="text-xs bg-[#b2fce4] text-black border-0">
              Clearpay
            </Badge>
            <Badge className="text-xs bg-[#ffd700] text-black border-0">
              0% Finance
            </Badge>
          </div>
        </div>
      </section>

      {/* Desktop Trust Badges */}
      <section className="hidden md:block border-t bg-muted/30 py-6">
        <div className="container">
          <div className="flex items-center justify-center gap-8">
            {/* ADI Code of Practice */}
            <img 
              src={logoAdiCode} 
              alt="ADI Code of Practice" 
              className="h-10 object-contain"
            />

            {/* MSA GB */}
            <img 
              src={logoMsa} 
              alt="MSA GB - For all driver trainers" 
              className="h-10 object-contain"
            />

            {/* CPD */}
            <img 
              src={logoCpd} 
              alt="Continuing Professional Development" 
              className="h-10 object-contain"
            />

            {/* Divider */}
            <div className="h-8 w-px bg-border" />

            {/* Card Payments */}
            <img 
              src={logoCardPayments} 
              alt="Visa, MasterCard, Maestro, JCB" 
              className="h-7 object-contain"
            />

            {/* Klarna */}
            <img 
              src={logoKlarna} 
              alt="Klarna" 
              className="h-7 object-contain rounded-md"
            />

            {/* Clearpay */}
            <img 
              src={logoClearpay} 
              alt="Clearpay" 
              className="h-7 object-contain rounded-md"
            />

            {/* iDeal 4 Finance */}
            <img 
              src={logoIdeal4Finance} 
              alt="iDeal 4 Finance" 
              className="h-7 object-contain rounded-md"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
