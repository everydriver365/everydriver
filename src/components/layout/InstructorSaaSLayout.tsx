import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
const logo = "/everydriver-logo-main.png";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

const navLinks = [
  { href: "/instructor-app", label: "Home" },
  { href: "/instructor-app/features", label: "Features" },
  { href: "/instructor-app/pricing", label: "Pricing" },
  { href: "/instructor-app/domains", label: "Domains" },
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
      {/* Header - Navy Blue to match brand */}
      <header className="sticky top-0 z-50 w-full border-b border-[#0f1a30] bg-[#142040]">
        <nav className="container max-w-7xl flex h-16 items-center justify-between">
          <Link to="/instructor-app" className="flex items-center">
            <img src={logo} alt="EveryDriver" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                  location.pathname === link.href ? "text-emerald-400" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <Link to="/instructor-app/login">Log in</Link>
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              <Link to="/instructor-app/signup">Get Started Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
