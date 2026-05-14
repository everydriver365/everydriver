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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouteLogo } from "@/hooks/useRouteLogo";

export default function Benefits() {
  const location = useLocation();
  const navigate = useNavigate();
  const { features, loading } = useIncludedFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const { logo, logoAlt, homeLink } = useRouteLogo();

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
            <Link to={homeLink}>
              <img src={logo} alt={logoAlt} className="h-8 -mx-1" />
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

      {/* Features List */}
      {!loading && (
        <div className="px-4 space-y-3">
          {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Accordion type="single" collapsible>
                  <AccordionItem 
                    value={feature.id} 
                    className="bg-card border rounded-2xl overflow-hidden"
                  >
                    {/* Vertical layout: Image top, content below */}
                    {feature.image_url && (
                      <div className="relative h-52 overflow-hidden">
                        <img 
                          src={feature.image_url} 
                          alt={feature.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="px-3 py-3">
                      <h3 className="font-bold text-foreground text-sm leading-snug">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{feature.description}</p>
                    </div>
                    
                    <AccordionTrigger className="hover:no-underline py-2 px-4 border-t border-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
                      <span className="text-xs text-primary/70">Tap to learn more</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 px-4 pt-0">
                      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                        {(feature.detailed_content || feature.description)
                          .split('\n\n')
                          .map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
          ))}
        </div>
      )}

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
