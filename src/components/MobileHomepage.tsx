import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Calendar, Car, ChevronRight, Home, BookOpen, HelpCircle, MessageCircle, Menu, MapPin, Gift, CalendarSearch, ShieldCheck, Copy, Check, Share2, X, Phone, Info, FileText, LogIn, Users, GraduationCap, UserCog, Star, Award, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { useBookingUpsells } from "@/hooks/useBookingUpsells";
import { useHomepageStats } from "@/hooks/useHomepageStats";
import { useHomepageHero } from "@/hooks/useHomepageHero";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroLearnerMobile from "@/assets/mobile-hero.png";

import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import intensiveCoursesIcon from "@/assets/intensive-courses-icon.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import semiIntensiveIcon from "@/assets/semi-intensive-icon.jpg";
import weeklyLessonsIcon from "@/assets/weekly-lessons-icon.jpg";
import referFriendsImage from "@/assets/refer-friends.png";
import { useDomainBranding } from "@/hooks/useDomainBranding";

export function MobileHomepage() {
  const [postcode, setPostcode] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<typeof includedFeatures[0] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showTestGuaranteeModal, setShowTestGuaranteeModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const {
    features: includedFeatures
  } = useIncludedFeatures();
  const { data: upsells } = useBookingUpsells();
  const { stats } = useHomepageStats();
  const { hero } = useHomepageHero();
  const earlierTestUpsell = upsells?.find(u => u.name.toLowerCase().includes('earlier test'));
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const branding = useDomainBranding();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${postcode}`);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const {
          latitude,
          longitude
        } = position.coords;
        const response = await fetch(`https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`);
        const data = await response.json();
        if (data.result && data.result.length > 0) {
          const foundPostcode = data.result[0].postcode;
          setPostcode(foundPostcode);
          navigate(`/courses?postcode=${foundPostcode}`);
        }
      } catch (error) {
        console.error("Error getting postcode from location:", error);
      } finally {
        setIsLocating(false);
      }
    }, error => {
      console.error("Geolocation error:", error);
      setIsLocating(false);
    }, {
      enableHighAccuracy: false,
      timeout: 10000
    });
  };

  const navItems = [{
    label: "Home",
    icon: Home,
    path: "/"
  }, {
    label: "Search",
    icon: Search,
    path: "/courses"
  }, {
    label: "Theory",
    icon: BookOpen,
    path: "/theory"
  }, {
    label: "FAQs",
    icon: HelpCircle,
    path: "/faqs"
  }, {
    label: "Help",
    icon: MessageCircle,
    path: "/help"
  }, {
    label: "Benefits",
    icon: Gift,
    path: "/benefits"
  }];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Top bar with auth buttons */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-border/50">
        <img src={branding.logoPath} alt={branding.brandName} className="h-9" />
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-4 rounded-full text-xs font-semibold border-2"
            asChild
          >
            <Link to="/learner-app/login">Sign In</Link>
          </Button>
          <Button 
            size="sm" 
            className="h-8 px-4 rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
            asChild
          >
            <Link to="/learner-app/signup">Sign Up</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Hero Section - Dark Blue Gradient with World Map Pattern */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)',
          backgroundImage: `
            linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%),
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.857 8.485 15.272 9.9l9.9-9.9h-2.83zM32 0l-3.486 3.485-1.414 1.415L32 0zM0 5.373l.828-.83 1.415 1.415L0 8.2V5.374zm0 5.656l.828-.829 1.415 1.415L0 13.857v-2.83zm0 5.657l.828-.828 1.415 1.414L0 19.514v-2.83zm0 5.657l.828-.828 1.415 1.414L0 25.172v-2.83zm0 5.657l.828-.828 1.415 1.414L0 30.828v-2.83z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")
          `
        }}
      >
        <div className="relative px-5 pt-10 pb-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
              <Star className="h-3.5 w-3.5 fill-current" />
              {hero.badge_text}
            </span>
          </motion.div>
          
          {/* Main Headline - Bold Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] text-white mb-4"
          >
            {hero.headline_line1}
            <br />
            <span className="text-white">{hero.headline_line2} </span>
            <span className="text-accent">{hero.headline_highlight}</span>
            <br />
            {hero.headline_line3}
          </motion.h1>
          
          {/* Subtext with Highlight */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-white/80 leading-relaxed mb-6"
          >
            An ideal solution for <span className="font-semibold text-accent">learner drivers</span> looking to pass their test quickly and confidently
          </motion.p>
          
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              size="lg"
              className="h-14 px-8 rounded-xl text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30"
              onClick={() => {
                const searchSection = document.getElementById('search-section');
                searchSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Your Journey
            </Button>
          </motion.div>
        </div>
        
        {/* Device Mockup / Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative px-4 -mb-8"
        >
          <div className="relative mx-auto max-w-xs">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <img 
              src={heroLearnerMobile} 
              alt="Learn to drive with Every Driver" 
              className="w-full rounded-t-2xl shadow-2xl"
            />
          </div>
        </motion.div>
      </div>
      
      {/* Stats Section - Grid Layout */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-background px-4 pt-12 pb-6"
      >
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(0, 4).map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center py-4"
              >
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      
      {/* Search Section */}
      <div id="search-section" className="px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-primary rounded-2xl p-4 shadow-xl"
        >
          <h3 className="font-semibold text-sm text-primary-foreground text-center mb-3 uppercase tracking-wide">
            Search, Compare & Book Direct 24/7
          </h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <PostcodeAutocomplete 
                value={postcode} 
                onChange={setPostcode} 
                onSelect={pc => navigate(`/courses?postcode=${pc}`)} 
                placeholder={hero.search_placeholder || "Enter postcode..."} 
                inputClassName="h-12 text-sm bg-white border-0 rounded-xl text-foreground placeholder:text-muted-foreground shadow-sm" 
                showGeolocation={true} 
              />
            </div>
            <Button type="submit" className="h-12 px-5 rounded-xl font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
              <Search className="h-4 w-4 mr-1" />
              Find
            </Button>
          </form>
        </motion.div>
      </div>
      
      {/* Course Category Tiles */}
      <div className="px-4 space-y-3">
        {/* Full Width - Intensive Courses */}
        <Link to="/intensives">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.85 }}
            className="bg-card border border-border/50 rounded-2xl shadow-lg flex items-center overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="w-24 h-24 flex-shrink-0 bg-primary/5">
              <img src={intensiveCoursesIcon} alt="Intensive Courses" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-4">
              <h4 className="font-semibold text-foreground">Intensive Courses</h4>
              <p className="text-sm text-muted-foreground">Pass in 1-2 weeks</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground mr-4" />
          </motion.div>
        </Link>
        
        {/* 2x Grid - Semi Intensive & Weekly Lessons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/semi-intensive">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.9 }}
              className="bg-card border border-border/50 rounded-2xl shadow-lg h-full overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-20 w-full overflow-hidden">
                <img src={semiIntensiveIcon} alt="Semi Intensive" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-foreground">Semi Intensive</h4>
                <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
              </div>
            </motion.div>
          </Link>
          
          <Link to="/courses">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl shadow-lg h-full overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-20 w-full overflow-hidden">
                <img src={weeklyLessonsIcon} alt="Weekly Lessons" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-foreground">Weekly Lessons</h4>
                <p className="text-xs text-muted-foreground mt-1">Flexible pace</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
      
      {/* What's Included Section */}
      <div className="px-4 pt-6">
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3">What's Included</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {includedFeatures.slice(0, 6).map((feature, i) => {
            const IconComponent = feature.icon;
            return (
              <motion.div 
                key={feature.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 1 + i * 0.05 }}
                onClick={() => setSelectedFeature(feature)} 
                className="bg-card border border-border/50 rounded-2xl shadow-lg cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl overflow-hidden"
              >
                {feature.image_url ? (
                  <div className="relative h-24 w-full">
                    <img 
                      src={feature.image_url} 
                      alt={feature.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="h-24 w-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Guaranteed Earlier Test Promotion */}
      <div className="px-4 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.1 }}
          onClick={() => setShowTestGuaranteeModal(true)}
          className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="p-4 flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CalendarSearch className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">Guaranteed Earlier Test</h4>
                  <p className="text-xs text-white/80 mt-0.5">We'll find you an earlier slot or your money back!</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                  £{earlierTestUpsell?.price?.toFixed(2) ?? '49.99'}
                </span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Guest Pass / Promo Banner - Full Width with Image */}
      <div className="px-4 pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.15 }}
          onClick={() => setShowReferralModal(true)}
          className="relative rounded-2xl overflow-hidden h-36 shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
        >
          <img src={referFriendsImage} alt="Refer a friend" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 p-5 h-full flex flex-col justify-center">
            <h4 className="font-bold text-xl text-white italic">Refer a Friend</h4>
            <p className="text-sm text-white/80 mt-1">Get £50 off when your friend books</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Learn More
              </span>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Payment Providers Section */}
      <div className="px-4 pt-4 pb-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.2 }}
          className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">Pay your way with</p>
          <div className="flex items-center justify-center gap-4">
            <img src={logoKlarna} alt="Klarna" className="h-5 object-contain" />
            <img src={logoClearpay} alt="Clearpay" className="h-4 object-contain" />
            <img src={logoIdeal4Finance} alt="Ideal4Finance" className="h-5 object-contain" />
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Spacer for Nav */}
      <div className="h-24" />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary-foreground/10">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${isActive ? "text-white" : "text-primary-foreground/60 hover:text-primary-foreground/80"}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
              </Link>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-primary" />
      </nav>

      {/* Feature Detail Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedFeature && <>
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  {selectedFeature.icon && <selectedFeature.icon className="h-4 w-4 text-primary" />}
                </div>
                <span className="line-clamp-1">{selectedFeature.title}</span>
              </>}
            </DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-3">
              {selectedFeature.image_url && (
                <img src={selectedFeature.image_url} alt={selectedFeature.title} className="w-full h-32 object-cover rounded-xl" />
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedFeature.description}</p>
              {selectedFeature.detailed_content && (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:my-2 [&>ul]:space-y-1" 
                  dangerouslySetInnerHTML={{ __html: selectedFeature.detailed_content }} 
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guaranteed Earlier Test Modal */}
      <Dialog open={showTestGuaranteeModal} onOpenChange={setShowTestGuaranteeModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
            <DialogHeader className="pb-0">
              <DialogTitle className="flex items-center gap-2 text-white">
                <CalendarSearch className="h-5 w-5" />
                Guaranteed Earlier Test
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Our test date finding service works to secure you an earlier practical driving test. We monitor DVSA cancellations and book you an earlier slot automatically.
            </p>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-sm text-foreground">Money-Back Guarantee</p>
                <p className="text-xs text-muted-foreground">If we can't find an earlier date, you get a full refund</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">£{earlierTestUpsell?.price?.toFixed(2) ?? '49.99'}</p>
                <p className="text-xs text-muted-foreground">One-time fee</p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link to="/courses">Add to Booking</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="relative h-32 overflow-hidden">
            <img src={referFriendsImage} alt="Refer a friend" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <DialogHeader className="absolute bottom-3 left-4">
              <DialogTitle className="text-white text-lg">Refer a Friend</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Share the love and save! When you refer a friend to Every Driver, you both benefit:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="h-3 w-3 text-primary" />
                </div>
                <span>Your friend gets £25 off their booking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Gift className="h-3 w-3 text-emerald-600" />
                </div>
                <span>You get £50 credit when they complete</span>
              </div>
            </div>
            <div className="pt-2">
              <Button className="w-full" asChild>
                <Link to="/refer">Get Your Referral Code</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[300px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-1">
            <Link to="/learner-app/login" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <LogIn className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Sign In</span>
              </div>
            </Link>
            <Link to="/learner-app/signup" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Create Account</span>
              </div>
            </Link>
            <div className="h-px bg-border my-2" />
            <Link to="/courses" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Find Courses</span>
              </div>
            </Link>
            <Link to="/intensives" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Intensive Courses</span>
              </div>
            </Link>
            <Link to="/theory" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Theory Practice</span>
              </div>
            </Link>
            <Link to="/faqs" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">FAQs</span>
              </div>
            </Link>
            <div className="h-px bg-border my-2" />
            <Link to="/instructor-app/login" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <UserCog className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Instructor Login</span>
              </div>
            </Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">About Us</span>
              </div>
            </Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Contact</span>
              </div>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
