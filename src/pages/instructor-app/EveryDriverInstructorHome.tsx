import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Menu, X, Star, Users, TrendingUp, Calendar } from "lucide-react";
const mainLogo = "/everydriver-logo-v2.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Drive365InstallBanner } from "@/components/pwa/Drive365InstallBanner";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";
import { DeviceShowcase } from "@/components/instructor-app/DeviceShowcase";

export default function EveryDriverInstructorHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hero, features, loading, isSectionVisible } = useInstructorAppContent();
  
  return (
    <div className="min-h-screen bg-slate-950">
      {/* PWA Install Banner */}
      <Drive365InstallBanner />
      
      {/* Header - Dark with glass effect */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
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
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-6">
                Sign In
              </Button>
            </Link>
            <Link to="/instructor-app/signup">
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-full px-6">
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
              className="text-white hover:bg-white/10 rounded-full"
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
              className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                <Link to="/instructor-app/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10 justify-center rounded-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/instructor-app/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold justify-center rounded-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section - Premium Dark Design */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.857 8.485 15.272 9.9l9.9-9.9h-2.83zM32 0l-3.486 3.485-1.414 1.415L32 0zM0 5.373l.828-.83 1.415 1.415L0 8.2V5.374zm0 5.656l.828-.829 1.415 1.415L0 13.857v-2.83zm0 5.657l.828-.828 1.415 1.414L0 19.514v-2.83zm0 5.657l.828-.828 1.415 1.414L0 25.172v-2.83zm0 5.657l.828-.828 1.415 1.414L0 30.828v-2.83z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium mb-6 border border-amber-500/30"
            >
              {hero.badge_text}
            </motion.span>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
            >
              Grow Your{" "}
              <span className="text-amber-400">Driving School</span>
              <br />
              Business
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
            >
              {hero.subtext}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link to={hero.primary_cta_link}>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8 py-6 text-lg rounded-full w-full sm:w-auto">
                  {hero.primary_cta_text}
                </Button>
              </Link>
              <Link to={hero.secondary_cta_link}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full w-full sm:w-auto">
                  {hero.secondary_cta_text}
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                {hero.trust_badge1}
              </span>
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                {hero.trust_badge2}
              </span>
            </motion.div>
          </motion.div>

          {/* Device Showcase - Mobile & Desktop Mockups */}
          <DeviceShowcase />

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, value: "500+", label: "Active Instructors" },
              { icon: Star, value: "4.9", label: "Average Rating" },
              { icon: Calendar, value: "50K+", label: "Lessons Booked" },
              { icon: TrendingUp, value: "30%", label: "Revenue Increase" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
              >
                <stat.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid - CMS Driven */}
      {isSectionVisible('features') && (
        <section className="py-20 bg-slate-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything You Need to Run Your Business
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Powerful tools designed specifically for independent driving instructors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
                    <div className="w-12 h-12 bg-white/10 rounded-xl mb-4" />
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-full" />
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
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/60">
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
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of driving instructors already using EveryDriver
            </p>
            <Link to="/instructor-app/signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8 py-6 text-lg rounded-full">
                Start Your Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 text-white/50 py-12">
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
              <Link to="/instructor-app/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link to="/instructor-app/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/admin/login" className="hover:text-white transition-colors text-white/30 text-xs">
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
