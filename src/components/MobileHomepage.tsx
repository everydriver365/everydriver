import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Calendar, Car, ChevronRight, Home, BookOpen, HelpCircle, MessageCircle, Menu, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroLearnerMobile from "@/assets/hero-learner-mobile.jpg";
import logo from "@/assets/logo-everydriver-transparent.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useEmblaCarousel from "embla-carousel-react";

export function MobileHomepage() {
  const [postcode, setPostcode] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<typeof includedFeatures[0] | null>(null);
  const { features: includedFeatures } = useIncludedFeatures();
  const navigate = useNavigate();
  const location = useLocation();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${postcode}`);
    }
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Search", icon: Search, path: "/courses" },
    { label: "Theory", icon: BookOpen, path: "/theory" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Help", icon: MessageCircle, path: "/help" },
    { label: "Benefits", icon: Gift, path: "/benefits" },
  ];

  const promoBanners = [
    { title: "Refer a Friend", subtitle: "Get £50 off your next course", gradient: "from-amber-500 to-orange-500" },
    { title: "Free Retest", subtitle: "If you don't pass first time", gradient: "from-emerald-500 to-teal-500" },
    { title: "Theory Bundle", subtitle: "Save 20% on combined courses", gradient: "from-violet-500 to-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Clean minimal design */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-background border-b border-border/50">
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logo} alt="EveryDriver" className="h-9" />
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-full text-xs gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>Location</span>
        </Button>
      </div>
      
      {/* Hero Image with Overlapping Card */}
      <div className="relative">
        <div className="relative h-[260px] overflow-hidden">
          <img 
            src={heroLearnerMobile}
            alt="Learn to drive"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Promo Badge */}
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Free Retest if you fail
          </div>
        </div>
        
        {/* Overlapping Motivational Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 -mt-14 relative z-10"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" 
                        strokeWidth="4" className="text-muted/30" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor"
                        strokeWidth="4" className="text-primary" 
                        strokeDasharray="150" strokeDashoffset="110" 
                        strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Start Your Journey</h3>
              <p className="text-sm text-muted-foreground">Find local instructors near you</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </motion.div>
      </div>
      
      {/* Primary Action Tile - Find Instructors */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-primary rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-primary-foreground">Find Local Instructors</h4>
              <p className="text-xs text-primary-foreground/70">Enter your postcode to get started</p>
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <PostcodeAutocomplete
                value={postcode}
                onChange={setPostcode}
                onSelect={(pc) => navigate(`/courses?postcode=${pc}`)}
                placeholder="Enter postcode..."
                inputClassName="h-11 text-sm bg-primary-foreground border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                showGeolocation={true}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-11 px-5 rounded-xl font-medium">
              Search
            </Button>
          </form>
        </motion.div>
      </div>
      
      {/* Course Category Tiles */}
      <div className="px-4 pt-4 space-y-3">
        {/* Full Width - Intensive Courses */}
        <Link to="/intensives">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-card border border-border/50 rounded-2xl flex items-center gap-4 shadow-lg"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Intensive Courses</h4>
              <p className="text-sm text-muted-foreground">Pass in 1-2 weeks</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </Link>
        
        {/* 2x Grid - Semi Intensive & Lessons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/semi-intensive">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg h-full"
            >
              <div className="w-11 h-11 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="font-semibold text-sm">Semi Intensive</h4>
              <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
            </motion.div>
          </Link>
          
          <Link to="/courses">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg h-full"
            >
              <div className="w-11 h-11 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3">
                <Car className="h-5 w-5 text-amber-500" />
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
          {includedFeatures.slice(0, 4).map((feature, i) => {
            const IconComponent = feature.icon;
            const colors = [
              "bg-rose-500/10 text-rose-500",
              "bg-blue-500/10 text-blue-500",
              "bg-violet-500/10 text-violet-500",
              "bg-teal-500/10 text-teal-500",
            ];
            const colorClass = colors[i % colors.length];
            const [bgColor, textColor] = colorClass.split(" ");
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                onClick={() => setSelectedFeature(feature)}
                className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className={`w-11 h-11 ${bgColor} rounded-2xl flex items-center justify-center mb-3`}>
                  <IconComponent className={`h-5 w-5 ${textColor}`} />
                </div>
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Promo Banners Carousel */}
      <div className="pt-6 pb-2">
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3 px-4">Special Offers</h3>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 px-4">
            {promoBanners.map((banner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`flex-shrink-0 w-[280px] h-24 rounded-2xl overflow-hidden bg-gradient-to-r ${banner.gradient} relative`}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                <div className="relative z-10 p-4 text-white h-full flex flex-col justify-center">
                  <h4 className="font-bold text-base">{banner.title}</h4>
                  <p className="text-sm text-white/80">{banner.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Payment Providers Section */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
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
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                  isActive 
                    ? "text-white" 
                    : "text-primary-foreground/60 hover:text-primary-foreground/80"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
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
              {selectedFeature && (
                <>
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {selectedFeature.icon && <selectedFeature.icon className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="line-clamp-1">{selectedFeature.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-3">
              {selectedFeature.image_url && (
                <img 
                  src={selectedFeature.image_url} 
                  alt={selectedFeature.title}
                  className="w-full h-32 object-cover rounded-xl"
                />
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
    </div>
  );
}
