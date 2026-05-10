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
import heroLearnerMobile from "@/assets/drive365-hero-learner.png";
import { useRouteLogo } from "@/hooks/useRouteLogo";

import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import intensiveCoursesIcon from "@/assets/intensive-course-tile.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import semiIntensiveIcon from "@/assets/semi-intensive-icon.jpg";
import weeklyLessonsIcon from "@/assets/weekly-lessons-icon.jpg";
import earlierTestGuaranteedBadge from "@/assets/free-retest-badge.png";
import referFriendsImage from "@/assets/refer-friends.png";
import { useDomainBranding } from "@/hooks/useDomainBranding";
import { getWhitelabelConfig } from "@/lib/whitelabel";

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
  const routeLogo = useRouteLogo();
  const location = useLocation();
  const { toast } = useToast();
  const branding = useDomainBranding();
  const whitelabel = getWhitelabelConfig();
  const isWinchester = whitelabel?.host === "winchesterdrivingschool.co.uk";

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

  const navItems = isWinchester
    ? [
        { label: "Home", icon: Home, path: "/" },
        { label: "Courses", icon: Search, path: "/courses" },
        { label: "Theory", icon: BookOpen, path: "/theory" },
        { label: "Reviews", icon: Star, path: "/reviews" },
        { label: "Contact", icon: Phone, path: "/contact" },
      ]
    : [
        { label: "Home", icon: Home, path: "/drive365" },
        { label: "Search", icon: Search, path: "/courses" },
        { label: "Theory", icon: BookOpen, path: "/theory" },
        { label: "FAQs", icon: HelpCircle, path: "/faqs" },
        { label: "Help", icon: MessageCircle, path: "/help" },
        { label: "Benefits", icon: Gift, path: "/benefits" },
      ];

  return (
    <div className="learner-app min-h-screen bg-background">
      {/* Header - Hamburger + Logo + Location */}
      <div className="px-4 flex items-center justify-between sticky top-0 z-50 bg-primary h-16">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={routeLogo.logo} alt={routeLogo.logoAlt} className="h-8 -mx-1" />
          {routeLogo.logoText && (
            <span className="text-xs font-semibold text-primary-foreground leading-tight">
              {routeLogo.logoText}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 rounded-full text-xs font-semibold border-white/70 bg-white/15 text-white hover:bg-white/25 gap-1.5"
          onClick={handleGetLocation}
          disabled={isLocating}
        >
          <MapPin className="h-3.5 w-3.5" />
          Location
        </Button>
      </div>
      
      {/* Hero Image - Full Width */}
      <div className="relative">
        <img 
          src={heroLearnerMobile} 
          alt="Learn to drive with Every Driver" 
          className="w-full object-cover"
          style={{ maxHeight: '55vh' }}
        />

        {/* Winchester: phone + Book Now overlay on hero right */}
        {isWinchester && (
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
            <a
              href="tel:07767693276"
              className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-primary shadow-md hover:bg-white"
            >
              <Phone className="h-3.5 w-3.5" />
              07767 693276
            </a>
            <Link
              to="/courses"
              className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-primary shadow-md hover:bg-amber-300"
            >
              Book Now
            </Link>
          </div>
        )}
        {/* Search Card - Overlapping Hero Bottom */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 z-10">
          <div className="relative bg-primary rounded-2xl p-5 pt-4 shadow-xl">
           <div className="text-center mb-3">
               <h3 className="text-base font-bold text-primary-foreground uppercase tracking-wider">
                 FREE RE-TEST <span className="text-amber-400 font-black">IF YOU FAIL</span>
               </h3>
              <p className="text-xs text-primary-foreground/80 mt-0.5">
                Find your nearest instructor
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-0 bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <PostcodeAutocomplete 
                  value={postcode} 
                  onChange={setPostcode} 
                  onSelect={pc => navigate(`/courses?postcode=${pc}`)} 
                  placeholder="Enter postcode..." 
                  inputClassName="h-11 text-sm bg-transparent border-0 rounded-none pl-9 pr-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0" 
                  showGeolocation={false} 
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="h-11 w-11 flex items-center justify-center bg-muted/20 border-l border-border/30 text-muted hover:bg-muted/30 transition-colors"
              >
                <MapPin className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="h-11 w-11 flex items-center justify-center bg-muted/20 border-l border-border/30 text-muted hover:bg-muted/30 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Spacer for overlapping search card */}
      <div className="h-[5rem]" />
      
      {/* Course Category Tiles */}
      <div className="px-4 space-y-3">
        {/* Full Width - Intensive Courses */}
        <Link to="/intensives">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.85 }}
            className="relative bg-card border border-border/50 rounded-2xl shadow-lg flex items-center overflow-hidden hover:shadow-xl transition-shadow"
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
              className="relative bg-card border border-border/50 rounded-2xl shadow-lg h-full overflow-hidden hover:shadow-xl transition-shadow"
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
      
      {/* Free Re-Test if you Fail Promotion */}
      <div className="px-4 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.0 }}
          onClick={() => navigate("/earlier-test-guarantee")}
          className="etg-rounded-tile overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-transform"
          style={{ borderRadius: '16px' }}
        >
          <div className="flex">
            <div className="w-2/5 bg-emerald-600 flex items-center justify-center p-5">
              <img src={earlierTestGuaranteedBadge} alt="Free Re-Test if you Fail" className="w-full max-w-[120px] object-contain drop-shadow-lg" />
            </div>
            <div className="flex-1 bg-card p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">✓ Guaranteed</span>
              <h4 className="font-bold text-foreground text-sm mt-1">Free Re-Test if you Fail</h4>
              <p className="text-xs text-muted-foreground mt-1">Or your £62 test fee refunded in full</p>
              <div className="mt-2 flex items-center gap-1 text-emerald-600">
                <span className="text-xs font-semibold">Find out more</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </motion.div>
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
                transition={{ delay: 1.05 + i * 0.05 }}
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
          <div className="flex items-center justify-center gap-6">
            <img src={logoKlarna} alt="Klarna" className="h-5 object-contain" />
            <img src={logoClearpay} alt="Clearpay" className="h-4 object-contain" />
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Spacer for Nav */}
      <div className="h-24" />
      
      {/* Bottom Navigation */}
      {isWinchester ? (
        <WhitelabelBottomNav />
      ) : (
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
      )}

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

      {/* Free Re-Test Modal */}
      <Dialog open={showTestGuaranteeModal} onOpenChange={setShowTestGuaranteeModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
            <DialogHeader className="pb-0">
              <DialogTitle className="flex items-center gap-2 text-white">
                <CalendarSearch className="h-5 w-5" />
                Free Re-Test if you Fail
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
            <Link to="/pupil/login" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <LogIn className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Sign In</span>
              </div>
            </Link>
            <Link to="/pupil/login" onClick={() => setIsMenuOpen(false)}>
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
            <a href="https://everydriver.co.uk/instructor-app/login" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <UserCog className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Instructor Login</span>
              </div>
            </a>
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
