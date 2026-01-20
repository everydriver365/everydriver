import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Zap, Calendar, Car, ChevronRight, Home, BookOpen, HelpCircle, MessageCircle, Phone, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroLearnerMobile from "@/assets/hero-learner-mobile.jpg";
import logo from "@/assets/logo-everydriver-transparent.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";
import { useTheme } from "@/context/ThemeContext";

export function MobileHomepage() {
  const [postcode, setPostcode] = useState("");
  const { features: includedFeatures } = useIncludedFeatures();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${postcode}`);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Search", icon: Search, path: "/courses" },
    { label: "Theory", icon: BookOpen, path: "/theory" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Help", icon: MessageCircle, path: "/help" },
    { label: "Contact", icon: Phone, path: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matching main site nav styling */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-nav border-b border-nav-foreground/20">
        <Button variant="ghost" size="icon" className="h-10 w-10 text-nav-foreground hover:bg-nav-foreground/10">
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logo} alt="EveryDriver" className="h-10" />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 text-nav-foreground hover:bg-nav-foreground/10"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Full Width Postcode Search */}
      <div className="px-4 py-4">
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Enter your postcode..."
              className="pl-12 h-12 rounded-xl bg-muted/50 border border-border/50 shadow-sm"
            />
          </div>
          <Button type="submit" className="h-12 px-6 rounded-xl">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      {/* Hero Image with Overlay Card */}
      <div className="relative mx-4">
        <div className="relative h-[240px] rounded-3xl overflow-hidden">
          <img 
            src={heroLearnerMobile} 
            alt="Learning to drive" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>
        
        {/* Motivational Card Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-10 left-4 right-4 bg-card rounded-2xl p-4 shadow-xl border"
        >
          <h3 className="font-bold text-base uppercase tracking-wide">Start Your Journey</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Money back if you pass first time, a FREE retest if you don't
          </p>
        </motion.div>
      </div>
      
      {/* Spacer for overlay */}
      <div className="h-14" />
      
      {/* Course Category Tiles */}
      <div className="px-4 pt-2 space-y-3">
        {/* Full Width - Intensive Courses */}
        <Link to="/intensives">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-card border border-border/50 rounded-lg flex items-center gap-4 shadow-lg"
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Zap className="h-6 w-6 text-primary-foreground" />
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
              transition={{ delay: 0.4 }}
              className="p-4 bg-card border border-border/50 rounded-lg shadow-lg h-full"
            >
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm">Semi Intensive</h4>
              <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
            </motion.div>
          </Link>
          
          <Link to="/courses">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="p-4 bg-card border border-border/50 rounded-lg shadow-lg h-full"
            >
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm">Weekly Lessons</h4>
              <p className="text-xs text-muted-foreground mt-1">Flexible pace</p>
            </motion.div>
          </Link>
        </div>
        
        {/* What's Included Section - CMS Powered 2x3 Grid */}
        <div className="pt-4">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3">What's Included</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {includedFeatures.slice(0, 6).map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="relative overflow-hidden rounded-lg bg-card border border-border/50 shadow-lg"
                >
                  {feature.image_url ? (
                    <>
                      <img 
                        src={feature.image_url} 
                        alt={feature.title}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-md">
                        <IconComponent className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Payment Providers Section */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="bg-card border border-border/50 rounded-lg p-4 shadow-lg"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">Pay your way with</p>
          <div className="flex items-center justify-center gap-4">
            <img src={logoKlarna} alt="Klarna" className="h-5 object-contain" />
            <img src={logoClearpay} alt="Clearpay" className="h-4 object-contain" />
            <img src={logoIdeal4Finance} alt="Ideal4Finance" className="h-5 object-contain" />
          </div>
        </motion.div>
      </div>
      
      {/* Promo Banner */}
      <div className="px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="relative h-28 rounded-lg overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative z-10 p-4 text-primary-foreground h-full flex flex-col justify-center">
            <h4 className="font-bold">Refer a Friend</h4>
            <p className="text-sm text-white/80">Get £50 off your next course</p>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Navigation - matching main site */}
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
    </div>
  );
}
