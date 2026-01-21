import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Calendar, Car, ChevronRight, Home, BookOpen, HelpCircle, MessageCircle, Menu, MapPin, Gift, CalendarSearch, ShieldCheck, Copy, Check, Share2, X, Phone, Info, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { useBookingUpsells } from "@/hooks/useBookingUpsells";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroLearnerMobile from "@/assets/mobile-hero.png";
import logo from "@/assets/logo-everydriver-transparent.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import intensiveCoursesIcon from "@/assets/intensive-courses-icon.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import semiIntensiveIcon from "@/assets/semi-intensive-icon.jpg";
import weeklyLessonsIcon from "@/assets/weekly-lessons-icon.jpg";
import referFriendsImage from "@/assets/refer-friends.png";
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
  const earlierTestUpsell = upsells?.find(u => u.name.toLowerCase().includes('earlier test'));
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
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
        // Use postcodes.io reverse geocoding
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
  return <div className="min-h-screen bg-background">
      {/* Header - Same blue as bottom nav */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-primary border-b border-primary-foreground/10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logo} alt="EveryDriver" className="h-9" />
        <Button variant="secondary" size="sm" onClick={handleGetLocation} disabled={isLocating} className="h-8 px-3 rounded-full text-xs gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 disabled:opacity-50">
          <MapPin className={`h-3.5 w-3.5 ${isLocating ? "animate-pulse" : ""}`} />
          <span>{isLocating ? "Finding..." : "Location"}</span>
        </Button>
      </div>
      
      {/* Hero Image with Overlapping Card */}
      <div className="relative">
        <div className="relative h-[380px] overflow-hidden">
          <img src={heroLearnerMobile} alt="Learn to drive" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        {/* Overlapping Motivational Card with Search */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="mx-4 -mt-16 relative z-10">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 border border-primary-foreground/20 rounded-xl p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-primary-foreground uppercase tracking-wide text-center">Search, Compare & Book Direct 24/7</h3>
                
              </div>
              {/* Progress Ring with Days */}
              
            </div>
            {/* Search inside card */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <PostcodeAutocomplete value={postcode} onChange={setPostcode} onSelect={pc => navigate(`/courses?postcode=${pc}`)} placeholder="Enter postcode..." inputClassName="h-10 text-sm bg-white border border-primary-foreground/30 rounded-lg text-foreground placeholder:text-muted-foreground shadow-sm" showGeolocation={true} />
              </div>
              <Button type="submit" className="h-10 px-4 rounded-lg font-medium bg-white hover:bg-white/90 text-primary shadow-sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
      
      {/* Course Category Tiles */}
      <div className="px-4 pt-4 space-y-3">
        {/* Full Width - Intensive Courses */}
        <Link to="/intensives">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }} className="bg-card border border-border/50 rounded-2xl shadow-lg flex items-center overflow-hidden">
          <div className="w-24 h-24 flex-shrink-0 bg-primary/5">
              <img src={intensiveCoursesIcon} alt="Intensive Courses" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-4">
              <h4 className="font-semibold">Intensive Courses</h4>
              <p className="text-sm text-muted-foreground">Pass in 1-2 weeks</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground mr-4" />
          </motion.div>
        </Link>
        
        {/* 2x Grid - Semi Intensive & Weekly Lessons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/semi-intensive">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.35
          }} className="bg-card border border-border/50 rounded-2xl shadow-lg h-full overflow-hidden">
              <div className="h-20 w-full overflow-hidden">
                <img src={semiIntensiveIcon} alt="Semi Intensive" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm">Semi Intensive</h4>
                <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
              </div>
            </motion.div>
          </Link>
          
          <Link to="/courses">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }} className="bg-card border border-border/50 rounded-2xl shadow-lg h-full overflow-hidden">
              <div className="h-20 w-full overflow-hidden">
                <img src={weeklyLessonsIcon} alt="Weekly Lessons" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm">Weekly Lessons</h4>
                <p className="text-xs text-muted-foreground mt-1">Flexible pace</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
      
      {/* What's Included Section - 2x2 Grid with Colored Icons */}
      <div className="px-4 pt-6">
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3">What's Included</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {includedFeatures.slice(0, 6).map((feature, i) => {
          const IconComponent = feature.icon;
          return <motion.div key={feature.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.45 + i * 0.05
          }} onClick={() => setSelectedFeature(feature)} className="bg-card border border-border/50 rounded-2xl shadow-lg cursor-pointer active:scale-[0.98] transition-transform overflow-hidden">
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
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                </div>
              </motion.div>;
        })}
        </div>
      </div>

      {/* Guaranteed Earlier Test Promotion */}
      <div className="px-4 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }}
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
          transition={{ delay: 0.75 }}
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
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.85
      }} className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg">
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
          return <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${isActive ? "text-white" : "text-primary-foreground/60 hover:text-primary-foreground/80"}`}>
                <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
              </Link>;
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
          {selectedFeature && <div className="space-y-3">
              {selectedFeature.image_url && <img src={selectedFeature.image_url} alt={selectedFeature.title} className="w-full h-32 object-cover rounded-xl" />}
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedFeature.description}</p>
              {selectedFeature.detailed_content && <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:my-2 [&>ul]:space-y-1" dangerouslySetInnerHTML={{
            __html: selectedFeature.detailed_content
          }} />}
            </div>}
        </DialogContent>
      </Dialog>
      {/* Guaranteed Earlier Test Modal */}
      <Dialog open={showTestGuaranteeModal} onOpenChange={setShowTestGuaranteeModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
            <DialogHeader className="pb-0">
              <DialogTitle className="flex items-center gap-2 text-white text-lg">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CalendarSearch className="h-5 w-5 text-white" />
                </div>
                <span>Guaranteed Earlier Test</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">
                £{earlierTestUpsell?.price?.toFixed(2) ?? '49.99'}
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Money-back guarantee
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {earlierTestUpsell?.short_description ?? "We'll actively search for earlier test cancellations and book you in when one becomes available."}
            </p>
            
            {earlierTestUpsell?.full_description && (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:my-2 [&>ul]:space-y-1"
                dangerouslySetInnerHTML={{ __html: earlierTestUpsell.full_description }}
              />
            )}
            
            {earlierTestUpsell?.refund_policy && (
              <div className="bg-muted/50 rounded-xl p-3">
                <h4 className="font-semibold text-sm text-foreground mb-1">Refund Policy</h4>
                <p className="text-xs text-muted-foreground">{earlierTestUpsell.refund_policy}</p>
              </div>
            )}
            
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              onClick={() => {
                setShowTestGuaranteeModal(false);
                navigate('/courses');
              }}
            >
              Find a Course & Add This
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Refer a Friend Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          <div className="relative h-32 overflow-hidden">
            <img src={heroLearnerMobile} alt="Refer a friend" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
            <DialogHeader className="absolute bottom-0 left-0 right-0 p-4 pb-3">
              <DialogTitle className="flex items-center gap-2 text-white text-lg">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <span>Refer a Friend</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <span className="text-3xl font-bold text-primary">£50</span>
              <p className="text-sm text-muted-foreground mt-1">discount for you & your friend</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">How it works</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-muted-foreground">Share your unique referral link with friends who want to learn to drive</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-muted-foreground">Your friend books a course using your link and gets £50 off</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <p className="text-sm text-muted-foreground">Once they complete their first lesson, you get £50 credit too!</p>
                </div>
              </div>
            </div>
            
            {/* Referral Code Display */}
            <div className="bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your referral code</p>
              <p className="text-2xl font-bold tracking-widest text-primary">FRIEND50</p>
            </div>
            
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground text-center">
                Terms apply. Referral credit is applied after your friend completes their first paid lesson.
              </p>
            </div>
            
            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  const message = `🚗 Get £50 off your driving lessons with EveryDriver! Use my code: FRIEND50 when you book. ${window.location.origin}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  const message = `Get £50 off your driving lessons with EveryDriver! Use my code: FRIEND50 when you book. ${window.location.origin}`;
                  window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Text Message
              </Button>
            </div>
            
            <Button 
              variant="secondary"
              className="w-full"
              onClick={async () => {
                const message = `Get £50 off your driving lessons! Use code: FRIEND50 at ${window.location.origin}`;
                try {
                  await navigator.clipboard.writeText(message);
                  toast({
                    title: "Copied!",
                    description: "Message copied to clipboard.",
                  });
                } catch (err) {
                  toast({
                    title: "Code: FRIEND50",
                    description: "Share this code with friends.",
                  });
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b bg-primary">
            <SheetTitle className="flex items-center gap-3">
              <img src={logo} alt="EveryDriver" className="h-8" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-2">
            {[
              { label: "Home", icon: Home, path: "/" },
              { label: "Search Courses", icon: Search, path: "/courses" },
              { label: "Intensive Courses", icon: Zap, path: "/intensives" },
              { label: "Semi Intensive", icon: Calendar, path: "/semi-intensive" },
              { label: "Theory Practice", icon: BookOpen, path: "/theory" },
              { label: "FAQs", icon: HelpCircle, path: "/faqs" },
              { label: "Help & Support", icon: MessageCircle, path: "/help" },
              { label: "Benefits", icon: Gift, path: "/benefits" },
              { label: "Contact Us", icon: Phone, path: "/contact" },
              { label: "About Us", icon: Info, path: "/about" },
              { label: "Privacy Policy", icon: FileText, path: "/privacy-policy" },
              { label: "Terms of Service", icon: FileText, path: "/terms-of-service" },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>;
}