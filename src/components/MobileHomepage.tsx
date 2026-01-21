import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Calendar, Car, ChevronRight, Home, BookOpen, HelpCircle, MessageCircle, Menu, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroLearnerMobile from "@/assets/mobile-hero.png";
import logo from "@/assets/logo-everydriver-transparent.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import intensiveCoursesIcon from "@/assets/intensive-courses-icon.gif";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export function MobileHomepage() {
  const [postcode, setPostcode] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<typeof includedFeatures[0] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const {
    features: includedFeatures
  } = useIncludedFeatures();
  const navigate = useNavigate();
  const location = useLocation();
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
        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/10">
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
            <div className="w-20 h-20 flex-shrink-0 bg-primary/5">
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
          }} className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg h-full">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">Semi Intensive</h4>
              <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
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
          }} className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg h-full">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">Weekly Lessons</h4>
              <p className="text-xs text-muted-foreground mt-1">Flexible pace</p>
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

      {/* Guest Pass / Promo Banner - Full Width with Image */}
      <div className="px-4 pt-6">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }} className="relative rounded-2xl overflow-hidden h-36 shadow-lg">
          <img src={heroLearnerMobile} alt="Refer a friend" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 p-5 h-full flex flex-col justify-center">
            <h4 className="font-bold text-xl text-white italic">Refer a Friend</h4>
            <p className="text-sm text-white/80 mt-1">Get £50 off when your friend books</p>
            <Button size="sm" className="mt-3 w-fit bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 text-xs font-medium">
              Get Referral Link
            </Button>
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
    </div>;
}