import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Menu, X } from "lucide-react";
const mainLogo = "/everydriver-logo-v2.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Drive365InstallBanner } from "@/components/pwa/Drive365InstallBanner";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";

export default function EveryDriverInstructorHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hero, features, loading, isSectionVisible } = useInstructorAppContent();
  
  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      <Drive365InstallBanner />
      
      {/* Header - Navy Blue to match brand */}
      <header className="sticky top-0 z-50 bg-[#142040] border-b border-[#0f1a30]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src={mainLogo}
            alt="EveryDriver"
            className="h-8 md:h-10"
          />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link to="/instructor-app/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Log In
              </Button>
            </Link>
            <Link to="/instructor-app/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0f1a30] border-t border-[#1a2744]"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                <Link to="/instructor-app/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10 justify-center">
                    Log In
                  </Button>
                </Link>
                <Link to="/instructor-app/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white justify-center">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section - CMS Driven */}
      <section className="bg-gradient-to-b from-[hsl(228,45%,35%)] to-[hsl(228,50%,25%)] text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
              {hero.badge_text}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {hero.headline_part1}{" "}
              <span className="text-emerald-400">{hero.headline_highlight}</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              {hero.subtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={hero.primary_cta_link}>
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg">
                  {hero.primary_cta_text}
                </Button>
              </Link>
              <Link to={hero.secondary_cta_link}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg">
                  {hero.secondary_cta_text}
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                {hero.trust_badge1}
              </span>
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                {hero.trust_badge2}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - CMS Driven */}
      {isSectionVisible('features') && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need to Run Your Business
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Powerful tools designed specifically for independent driving instructors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                ))
              ) : (
                features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-[hsl(228,54%,17%)]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of driving instructors already using EveryDriver
            </p>
            <Link to="/instructor-app/signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg">
                Start Your Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#142040] text-white/60 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img
              src={mainLogo}
              alt="EveryDriver"
              className="h-8"
            />
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="/instructor-app/features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/instructor-app/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="text-white/30">|</span>
              <Link to="/drive365" className="hover:text-white transition-colors text-emerald-400 font-medium">
                Drive365 Learners
              </Link>
              <Link to="/pupil/login" className="hover:text-white transition-colors">
                Pupil Portal
              </Link>
              <Link to="/instructor-app/login" className="hover:text-white transition-colors">
                Instructor Login
              </Link>
              <Link to="/admin/login" className="hover:text-white transition-colors text-white/40 text-xs">
                Admin
              </Link>
            </nav>
            <p className="text-sm">
              © {new Date().getFullYear()} EveryDriver. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
