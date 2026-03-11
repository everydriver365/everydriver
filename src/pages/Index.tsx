import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, Headphones, ChevronDown, Loader2, Timer, CalendarCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link, useNavigate } from "react-router-dom";
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
import featureRetestFallback from "@/assets/failed-driving-test.png";
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
import logoAdiCode from "@/assets/logo-adi-code.jpg";
import logoMsa from "@/assets/logo-msa.jpg";
import logoCpd from "@/assets/logo-cpd.jpg";
import logoCardPayments from "@/assets/logo-card-payments.png";
import heroMobile from "@/assets/hero-mobile.png";
import earlyTestBadge from "@/assets/earlier-test-guaranteed-badge.png";
import heroInstructorNew from "@/assets/hero-instructor-new.png";
// Features, stats, testimonials, and hero content are now loaded dynamically via hooks

export default function Index() {
  const navigate = useNavigate();
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
      {/* Hero Section - ADI Marketing */}
      <section className="relative min-h-[600px] overflow-hidden bg-white py-16 lg:py-24">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">The Free Diary App</span>
                <br />
                <span className="text-[#0075c9]">Built for ADIs</span>
              </h1>
              
              {/* Subtext */}
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Manage your lessons, track payments, and grow your business — all from one app. Free forever, no credit card required.
              </p>
              
              {/* Postcode Search */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Find driving courses near you</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <PostcodeAutocomplete
                    value={postcode}
                    onChange={setPostcode}
                    onSelect={(pc) => {
                      setPostcode(pc);
                      navigate(`/courses?postcode=${encodeURIComponent(pc)}`);
                    }}
                    placeholder="Enter your postcode..."
                    className="flex-1"
                    inputClassName="h-12 text-base"
                    showGeolocation={true}
                  />
                  <Button 
                    size="xl" 
                    className="bg-[#0075c9] hover:bg-[#0063ab] text-white shadow-lg h-12"
                    onClick={() => {
                      if (postcode) navigate(`/courses?postcode=${encodeURIComponent(postcode)}`);
                    }}
                  >
                    <Search className="mr-2 h-5 w-5" /> Find Courses
                  </Button>
                </div>
              </div>
              
              {/* Trust Row */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> GDPR compliant
                </span>
              </div>
            </motion.div>

            {/* Right Content - Hero Image with Floating Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:flex items-center justify-center"
            >
              <img 
                src={heroInstructorNew} 
                alt="Driving instructor with DRIVE365 branded materials in a red learner car" 
                className="w-full max-w-lg rounded-2xl shadow-2xl"
              />
              
              {/* Floating Badge - Fill Rate */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="absolute top-4 right-0 lg:-right-4 bg-white rounded-xl px-4 py-3 shadow-xl border border-border"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#0075c9]" />
                  <div>
                    <div className="font-bold text-foreground text-sm">98% Fill rate</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Badge - Active Instructors */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute bottom-8 left-4 lg:-left-4 bg-white rounded-xl px-4 py-3 shadow-xl border border-border"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  <div>
                    <div className="font-bold text-foreground text-sm">500+ Active instructors</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guaranteed Earlier Test Promotion Banner — Feature Grid */}
      <section className="py-4">
          <Link to="/earlier-test-guarantee">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="border-y bg-card shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="w-28 h-28 object-contain drop-shadow-lg" />
                  <h3 className="text-2xl font-black text-white">Earlier Test Guarantee</h3>
                </div>
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/20 text-sm px-4 py-1">Most Popular</Badge>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-4 gap-6 max-w-5xl mx-auto">
                  {[
                    { icon: Timer, title: "4 Weeks Sooner", desc: "Average time saved" },
                    { icon: Shield, title: "Money Back", desc: "If we can't find earlier" },
                    { icon: CalendarCheck, title: "24/7 Monitoring", desc: "Automated scanning" },
                    { icon: Zap, title: "Instant Alerts", desc: "SMS & app notifications" },
                  ].map(f => (
                    <div key={f.title} className="text-center">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                        <f.icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-bold">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t flex items-center justify-between max-w-5xl mx-auto">
                  <p className="text-sm text-muted-foreground">Skip months of waiting — we do the hard work for you.</p>
                  <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
      </section>

      {/* Choose Your Learning Path Section */}
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
                <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="absolute left-2 bottom-2 w-32 h-32 drop-shadow-lg object-contain" />
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
                <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="absolute left-2 bottom-2 w-32 h-32 drop-shadow-lg object-contain" />
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
                  className="group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl cursor-pointer"
                  style={{ backgroundColor: "#e9f4f9" }}
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

      {/* Video Story Section — Testimonial-Led */}
      <section className="bg-gradient-to-b from-amber-50 to-background py-20">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-4xl font-black mb-2">
              "They Changed My Life"
            </h2>
            <p className="text-muted-foreground">— Sarah, passed first time after 30 hours</p>
          </motion.div>

          {/* Video with testimonial cards floating */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img
                src={videoThumbnailImg}
                alt="Our Story Video"
                className="aspect-video w-full object-cover"
              />
              <button
                onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
                disabled={!welcomeVideoUrl}
                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur"
                >
                  <Play className="h-8 w-8 fill-amber-500 text-amber-500 ml-1" />
                </motion.div>
              </button>
            </div>

            {/* Floating testimonial cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -left-4 bg-white rounded-2xl shadow-xl p-4 max-w-[220px] border hidden lg:block"
            >
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-600 italic">"Best decision I ever made!"</p>
              <p className="text-[10px] font-semibold text-zinc-400 mt-1">— James, Manchester</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 max-w-[220px] border hidden lg:block"
            >
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-600 italic">"Passed first time, so happy!"</p>
              <p className="text-[10px] font-semibold text-zinc-400 mt-1">— Priya, London</p>
            </motion.div>
          </motion.div>

          <div className="flex justify-center mt-12 gap-4">
            <Button
              onClick={() => welcomeVideoUrl && setVideoModalOpen(true)}
              disabled={!welcomeVideoUrl}
              className="gap-2 bg-amber-500 hover:bg-amber-600 font-bold"
            >
              <Play className="h-4 w-4 fill-white" />
              Watch Our Story
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/about">
                Read More Stories
                <Heart className="h-4 w-4" />
              </Link>
            </Button>
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
                <motion.a
                  key={article.link}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="group"
                >
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
                </motion.a>
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
            <a href="https://despatch.blog.gov.uk/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                View All Articles <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
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

      {/* Features Section — Split Panel */}
      <section className="container py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">All-in-One Platform</Badge>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Everything You Need to
              <span className="text-accent"> Learn to Drive</span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Our platform connects learners, instructors, and parents in one seamless experience.
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">Key Features</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-xs text-muted-foreground">Portals</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5★</div>
                <div className="text-xs text-muted-foreground">Rated</div>
              </div>
            </div>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: User, title: "Pupil Portal", description: "Track lessons, view progress, and manage payments all in one place.", link: "/pupil/login", color: "from-blue-500 to-blue-600" },
              { icon: Users, title: "Parent Portal", description: "Stay informed with lesson updates, progress reports, and payment visibility.", link: "/parent", color: "from-emerald-500 to-emerald-600" },
              { icon: Calendar, title: "Live Availability", description: "Real-time calendar sync shows you exactly when instructors are free to book.", color: "from-violet-500 to-violet-600" },
              { icon: MapPin, title: "Local Instructors", description: "Find certified instructors near you by postcode with adjustable search radius.", color: "from-rose-500 to-rose-600" },
              { icon: Award, title: "Track Progress", description: "Monitor your learning journey with detailed progress reports and skill assessments.", color: "from-amber-500 to-amber-600" },
            ].map((f, i) => {
              const content = (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group cursor-pointer"
                >
                  <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br ${f.color} p-2.5 h-fit`}>
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
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

      {/* CTA Section */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="gradient-hero p-8 text-center md:p-16"
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

      {/* Desktop Trust Badges - V9 Stacked Compact Design */}
      <section className="hidden md:block bg-card border-y border-border py-6">
        <div className="container max-w-3xl space-y-4">
          {/* Accreditations Row */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img 
                src={logoAdiCode} 
                alt="ADI Code of Practice" 
                className="h-9 object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img 
                src={logoMsa} 
                alt="MSA GB - For all driver trainers" 
                className="h-9 object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <img 
                src={logoCpd} 
                alt="Continuing Professional Development" 
                className="h-9 object-contain"
              />
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-border w-full" />
          
          {/* Payment Row */}
          <div className="flex items-center justify-center gap-6">
            <span className="text-sm text-muted-foreground">Pay with</span>
            <img 
              src={logoCardPayments} 
              alt="Visa, MasterCard, Maestro, JCB" 
              className="h-6 object-contain"
            />
            <img 
              src={logoKlarna} 
              alt="Klarna" 
              className="h-6 object-contain rounded"
            />
            <img 
              src={logoClearpay} 
              alt="Clearpay" 
              className="h-6 object-contain rounded"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
