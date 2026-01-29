import { motion } from "framer-motion";
import { 
  Home,
  Search,
  BookOpen as TheoryIcon,
  HelpCircle,
  MessageCircle,
  Gift
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";

export default function Benefits() {
  const location = useLocation();
  const { features, loading } = useIncludedFeatures();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Search", icon: Search, path: "/courses" },
    { label: "Theory", icon: TheoryIcon, path: "/theory" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Help", icon: MessageCircle, path: "/help" },
    { label: "Benefits", icon: Gift, path: "/benefits" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Primary Blue to match brand */}
      <div className="px-4 py-3 flex items-center justify-center sticky top-0 z-50 bg-primary border-b border-primary-foreground/10">
        <img src="/everydriver-logo.png" alt="EveryDriver" className="h-7" />
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
                    className="bg-[#e9f4f9] border rounded-xl overflow-hidden"
                  >
                    {/* Horizontal layout: Image left, content right */}
                    <div className="flex items-stretch">
                      {/* Left: Image */}
                      {feature.image_url && (
                        <div className="w-20 flex-shrink-0 overflow-hidden">
                          <img 
                            src={feature.image_url} 
                            alt={feature.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {/* Right: Text Content */}
                      <div className="flex-1 p-3 flex flex-col justify-center">
                        <h3 className="font-bold text-foreground text-sm leading-tight">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                      </div>
                    </div>
                    
                    <AccordionTrigger className="hover:no-underline py-2 px-4 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">Tap to learn more</span>
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