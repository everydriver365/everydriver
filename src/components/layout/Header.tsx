import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MapPin, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { PromoBanner } from "./PromoBanner";
import { SecondaryNav } from "./SecondaryNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTheme } from "@/context/ThemeContext";
import { useRouteLogo } from "@/hooks/useRouteLogo";

const baseNavLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/drive365/franchise", label: "Franchise" },
  { href: "/faqs", label: "FAQs" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];


export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { logo, logoAlt, logoText, homeLink } = useRouteLogo();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${encodeURIComponent(postcode.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-hidden">
      <div className="bg-primary overflow-x-hidden">
      <nav className="px-4 max-w-7xl mx-auto flex h-16 items-center justify-between relative" role="navigation" aria-label="Main navigation">
        <Link to={homeLink} className="hidden md:flex items-center gap-2">
          <img src={logo} alt={logoAlt} className="h-9 -mx-1" />
          {logoText && <span className="text-sm font-semibold text-nav-foreground">{logoText}</span>}
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
          {/* Postcode Search */}
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="flex items-center rounded-full bg-white pl-3 pr-1 py-1">
              <MapPin className="h-4 w-4 text-muted-foreground/60 mr-2" />
              <Input
                type="text"
                placeholder="Your postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="h-8 w-28 border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <Search className="h-4 w-4 rotate-45" />
              </button>
              <Button type="submit" size="sm" className="h-8 rounded-full px-4 ml-1">
                Find Courses
              </Button>
            </div>
          </form>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-nav-foreground hover:bg-nav-foreground/10 h-9 w-9"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to={homeLink} className="flex items-center gap-1.5">
            <img src={logo} alt={logoAlt} className="h-8 -mx-1" />
            {logoText && <span className="text-xs font-semibold text-nav-foreground">{logoText}</span>}
          </Link>
        </div>
        {/* Mobile right-side controls */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-nav-foreground hover:bg-nav-foreground/10 h-9 w-9"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
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
                {/* Mobile Postcode Search */}
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
                
                <div className="border-t border-border mt-2 pt-2">
                <Link
                    to="/instructor-app/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex items-center gap-2"
                  >
                    Instructor Login
                  </Link>
                  <Link
                    to="/pupil/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex items-center gap-2"
                  >
                    Pupil Login
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      <div className="hidden md:block">
        <PromoBanner />
        <SecondaryNav />
      </div>
    </header>
  );
}
