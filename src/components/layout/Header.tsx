import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, User, GraduationCap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Find Courses" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const portalLinks = [
  { href: "/pupil", label: "Pupil Portal", icon: GraduationCap },
  { href: "/instructor", label: "Instructor Portal", icon: User },
  { href: "/parent", label: "Parent Portal", icon: Users },
  { href: "/admin", label: "Admin Portal", icon: Shield },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-nav/20 bg-nav">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="EveryDriver" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
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

        {/* Portal Dropdown & Login */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="group relative">
            <Button variant="outline" size="sm" className="border-nav-foreground/30 text-nav-foreground hover:bg-nav-foreground/10 hover:text-nav-foreground">
              Portals
            </Button>
            <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border bg-card p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              {portalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Button variant="accent" size="sm">
            Book Now
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
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
              <div className="my-2 border-t" />
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Portals
              </p>
              {portalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <div className="mt-2">
                <Button variant="accent" className="w-full">
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
