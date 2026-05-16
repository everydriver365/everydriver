import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/dsm-logo.png";
import { Footer } from "./Footer";
import { InstructorMarketingBottomNav } from "./InstructorMarketingBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/instructor-app/features", label: "Features" },
  { href: "/instructor-app/domains", label: "Websites & Domains" },
  { href: "/instructor-app/telematics", label: "Telematics" },
  { href: "/instructor-app/dashcam", label: "Dashcam" },
  { href: "/compare", label: "Pricing" },
  { href: "/instructor-app/about", label: "About" },
  { href: "/instructor-app/contact", label: "Contact" },
];

interface InstructorSaaSLayoutProps {
  children: React.ReactNode;
}

export function InstructorSaaSLayout({ children }: InstructorSaaSLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - Clean white */}
      <header className="sticky top-0 z-50 w-full">
        <div style={{ backgroundColor: "#0F2044" }}>
        <nav className="px-4 max-w-7xl mx-auto flex h-16 items-center justify-between relative">
          <Link to="/instructor-app" className="hidden md:flex items-center gap-2">
            <img src={logo} alt="DSM" className="h-10" />
            <span className="text-lg font-semibold text-nav-foreground">Driving School Manager</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden items-center gap-6 md:flex absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === link.href ? "text-accent" : "text-nav-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" className="text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-foreground/10" asChild>
              <Link to="/instructor-app/login">Log in</Link>
            </Button>
            <Button className="bg-[#0F2044] hover:bg-[#1A3370] text-white" asChild>
              <Link to="/instructor-app/signup">Get Started Free</Link>
            </Button>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-nav-foreground hover:bg-nav-foreground/10 h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/instructor-app" className="flex items-center gap-1.5">
              <img src={logo} alt="DSM" className="h-8" />
              <span className="text-sm font-semibold text-nav-foreground">Driving School Manager</span>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t bg-background md:hidden"
            >
              <div className="container py-4">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="border-t border-border mt-2 pt-2 flex flex-col gap-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/instructor-app/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button variant="default" className="w-full" asChild>
                      <Link to="/instructor-app/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started Free
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      
      <Footer />
      <InstructorMarketingBottomNav />
    </div>
  );
}
