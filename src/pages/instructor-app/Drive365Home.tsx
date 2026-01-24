import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Globe, Users, Shield, Smartphone } from "lucide-react";
import mainLogo from "@/assets/everydriver-logo-transparent.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drive365InstallBanner } from "@/components/pwa/Drive365InstallBanner";

const features = [
  {
    icon: Calendar,
    title: "Smart Calendar",
    description: "Manage your diary with drag-and-drop scheduling and Google Calendar sync",
  },
  {
    icon: CreditCard,
    title: "Get Paid Faster",
    description: "Accept card payments, track earnings, and send payment reminders",
  },
  {
    icon: Globe,
    title: "Your Own Website",
    description: "Professional mini-website with booking, reviews, and your branding",
  },
  {
    icon: Users,
    title: "Pupil Management",
    description: "Track progress, send notes, and keep all pupil records organized",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Full-featured PWA that works offline - install on any device",
  },
  {
    icon: Shield,
    title: "Compliance Tools",
    description: "CPD logging, document tracking, and expiry reminders",
  },
];

export default function Drive365Home() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      <Drive365InstallBanner />
      
      {/* Header - Navy Blue to match brand */}
      <header className="sticky top-0 z-50 bg-[#142040] border-b border-[#0f1a30]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src={mainLogo}
            alt="EveryDriver"
            className="h-8 md:h-10"
          />
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[hsl(228,54%,17%)] to-[hsl(228,54%,12%)] text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
              Built for UK Driving Instructors
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Complete Platform for{" "}
              <span className="text-emerald-400">Driving Instructors</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Manage your diary, pupils, payments, and marketing all in one place.
              Save hours every week and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/instructor-app/signup">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/instructor-app/features">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg">
                  View Features
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                No card required
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
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
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
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
            ))}
          </div>
        </div>
      </section>

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
      <footer className="bg-[hsl(228,54%,12%)] text-white/60 py-12">
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
