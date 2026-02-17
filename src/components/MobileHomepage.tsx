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
import drive365Logo from "@/assets/drive365-logo.png";

import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import intensiveCoursesIcon from "@/assets/intensive-courses-icon.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import semiIntensiveIcon from "@/assets/semi-intensive-icon.jpg";
import weeklyLessonsIcon from "@/assets/weekly-lessons-icon.jpg";
import earlyTestBadge from "@/assets/early_test_guaranteed.png";
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
    path: "/drive365"
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
          <img src={drive365Logo} alt="Drive365" className="h-8 -mx-1" />
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
        
        {/* Search Card - Overlapping Hero Bottom */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 z-10">
          <div className="bg-primary rounded-2xl p-4 shadow-xl">
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
              <Button type="submit" className="h-12 w-12 rounded-xl font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm p-0">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Spacer for overlapping search card */}
      <div className="h-[4.25rem]" />
      
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
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded-full shadow-sm shadow-amber-500/30 animate-pulse">
                <ShieldCheck className="h-3 w-3" /> Earlier Test Guarantee
              </span>
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
                <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm shadow-amber-500/30 animate-pulse">
                  <ShieldCheck className="h-2.5 w-2.5" /> Earlier Test
                </span>
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
