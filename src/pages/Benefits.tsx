import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home,
  Search,
  BookOpen as TheoryIcon,
  HelpCircle,
  MessageCircle,
  Gift,
  Menu,
  X,
  MapPin
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIncludedFeatures, IncludedFeatureData } from "@/hooks/useIncludedFeatures";
import { FeatureDetailModal } from "@/components/FeatureDetailModal";
import { FeatureData } from "@/hooks/useHomepageFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import drive365Logo from "@/assets/drive365-logo.png";
import { EarlierTestRequestTile } from "@/components/benefits/EarlierTestRequestTile";
import featureRetestFallback from "@/assets/failed-driving-test.png";
import featureAvailabilityFallback from "@/assets/feature-availability.jpg";
import featureTheoryFallback from "@/assets/feature-theory.jpg";
import featureTheoryPro from "@/assets/feature-theory-pro.jpg";
import featureCancellationFallback from "@/assets/feature-cancellation.jpg";
import featurePaymentsFallback from "@/assets/feature-payments.jpg";

function useFeatureImage(feature: IncludedFeatureData): string | null {
  if (feature.image_url) return feature.image_url;
  switch (feature.title.toLowerCase()) {
    case "theory test support": return featureTheoryFallback;
    case "flexible payments": return featurePaymentsFallback;
    case "free cancellation": return featureCancellationFallback;
    case "free re-test": return featureRetestFallback;
    case "live availability": return featureAvailabilityFallback;
    case "theory test pro": return featureTheoryPro;
    default: return null;
  }
}

export default function Benefits() {
  const location = useLocation();
  const navigate = useNavigate();
  const { features, loading } = useIncludedFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<IncludedFeatureData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [postcode, setPostcode] = useState("");

  const openModal = (f: IncludedFeatureData) => { setSelectedFeature(f); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${encodeURIComponent(postcode.trim())}`);
    }
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/drive365" },
    { label: "Search", icon: Search, path: "/courses" },
    { label: "Theory", icon: TheoryIcon, path: "/theory" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Help", icon: MessageCircle, path: "/help" },
    { label: "Benefits", icon: Gift, path: "/benefits" },
  ];

  return (
    <div className="learner-app min-h-screen bg-background pb-20">
      {/* Header with hamburger */}
      <div className="sticky top-0 z-50 bg-primary">
        <div className="px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/drive365">
              <img src={drive365Logo} alt="Drive365" className="h-8 -mx-1" />
            </Link>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-primary-foreground/10 bg-background"
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                <form onSubmit={handleSearch} className="mb-2">
                  <div className="flex items-center rounded-full bg-secondary px-3 py-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                      type="text"
                      placeholder="Enter your postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button type="submit" size="sm" className="h-8 rounded-full px-4 ml-2">
                      <Search className="h-4 w-4 mr-1" />
                      Search
                    </Button>
                  </div>
                </form>
                {[
                  { href: "/drive365", label: "Home" },
                  { href: "/courses", label: "Courses" },
                  { href: "/about", label: "About" },
                  { href: "/faqs", label: "FAQs" },
                  { href: "/help", label: "Help" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold">What's Included</h1>
          <p className="text-muted-foreground mt-2">
            Everything you get with every course
          </p>
        </motion.div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* V14 Glass Tiles */}
      {!loading && (
        <div className="px-4 space-y-4">
          {/* Earlier Test Guarantee - Featured Tile */}
          <EarlierTestRequestTile />

          <div className="grid grid-cols-3 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const img = useFeatureImage(feature);
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => openModal(feature)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-left rounded-2xl overflow-hidden bg-card/70 backdrop-blur ring-1 ring-border/50 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="h-28 overflow-hidden">
                    {img ? (
                      <img src={img} alt={feature.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                        <Icon className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-xs">{feature.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature as FeatureData | null}
        open={modalOpen}
        onClose={closeModal}
      />

      {/* CTA Section */}
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/courses">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center">
              <p className="font-semibold">Ready to get started?</p>
              <p className="text-sm opacity-90 mt-1">Find courses near you →</p>
            </div>
          </Link>
        </motion.div>
      </div>

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
    </div>
  );
}
