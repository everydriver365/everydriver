import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { PromoBanner } from "./PromoBanner";
import { SecondaryNav } from "./SecondaryNav";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Find Courses" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];


export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${encodeURIComponent(postcode.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-nav/20 bg-nav">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="EveryDriver" className="h-12" />
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

        <div className="hidden items-center gap-3 md:flex">
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
              <Button type="submit" variant="accent" size="sm" className="h-8 rounded-full px-4 ml-1">
                Find Courses
              </Button>
            </div>
          </form>
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
              <div className="mt-2">
                <Link to="/courses">
                  <Button variant="accent" className="w-full">
                    Find Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </div>
      <PromoBanner />
      <SecondaryNav />
    </header>
  );
}
