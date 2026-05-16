import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import drive365Logo from "@/assets/drive365-logo.png";

const NAV_LINKS = [
  { href: "/drive365", label: "Home" },
  { href: "/courses", label: "Courses", hasDropdown: true },
  { href: "/theory", label: "Theory practice" },
  { href: "/test-swap", label: "Test Swap" },
  { href: "/drive365/franchise", label: "Franchise" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
];

const COURSES_DROPDOWN = [
  { href: "/courses?type=intensive", label: "Intensives" },
  { href: "/courses?type=semi-intensive", label: "Semi-Intensives" },
  { href: "/courses?type=lessons", label: "Lessons" },
  { href: "/contact?type=bespoke", label: "Bespoke Course Request" },
];

const PROMO_KEY = "drive365_promo_dismissed_v1";

export function Drive365Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const coursesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(PROMO_KEY) === "1") {
      setPromoVisible(false);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCoursesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!coursesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (coursesRef.current && !coursesRef.current.contains(e.target as Node)) {
        setCoursesOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCoursesOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [coursesOpen]);

  const dismissPromo = () => {
    setPromoVisible(false);
    try { localStorage.setItem(PROMO_KEY, "1"); } catch {}
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main navy bar */}
      <div className="w-full bg-primary">
        <div className="mx-auto flex h-[76px] items-center px-[60px] max-lg:px-5">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start shrink-0">
            <span
              className="text-white font-extrabold leading-none"
              style={{ fontSize: "28px", letterSpacing: "-0.02em", fontFamily: "Inter, Helvetica, sans-serif" }}
            >
              Drive365
            </span>
            <div className="flex items-center gap-[2px] mt-[8px]">
              <span className="block bg-[#d92e3a]" style={{ width: "26px", height: "3px" }} />
              <span className="block bg-[#1d4ed8]" style={{ width: "30px", height: "3px" }} />
            </div>
            <span
              className="hidden xl:block mt-[5px] text-primary-foreground/70 uppercase"
              style={{ fontSize: "10px", letterSpacing: "0.22em" }}
            >
              Intensives · Semi-Intensives · Lessons
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-9 mx-auto">
            {NAV_LINKS.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.href}
                  className="relative"
                  ref={coursesRef}
                >
                  <button
                    type="button"
                    onClick={() => setCoursesOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={coursesOpen}
                    className="flex items-center gap-1 text-white text-[15px] font-medium hover:text-accent transition-colors"
                  >
                    {link.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", coursesOpen && "rotate-180")} />
                  </button>
                  {coursesOpen && (
                    <div className="absolute left-0 top-full pt-3 z-50">
                      <div className="bg-white rounded-lg shadow-xl py-2 min-w-[220px]">
                        {COURSES_DROPDOWN.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setCoursesOpen(false)}
                            className="block px-4 py-2 text-sm text-[#0a1936] hover:bg-[#1d4ed8]/10 hover:text-[#1d4ed8] transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-white text-[15px] font-medium hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side (desktop) */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <div className="text-[14px] font-medium text-primary-foreground/70">
              <Link to="/pupil/login" className="hover:text-white transition-colors">
                Pupil login
              </Link>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center bg-[#d92e3a] hover:bg-[#b8252f] text-white text-[14px] font-semibold transition-colors"
              style={{ width: "120px", height: "40px", borderRadius: "20px" }}
            >
              Find courses
            </Link>
          </div>

          {/* Mobile right side */}
          <div className="flex lg:hidden items-center gap-3 ml-auto">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center bg-[#d92e3a] hover:bg-[#b8252f] text-white text-[13px] font-semibold transition-colors"
              style={{ height: "36px", padding: "0 16px", borderRadius: "18px" }}
            >
              Find courses
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="text-white p-2"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-primary">
            <div className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-white text-base font-medium py-2.5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {COURSES_DROPDOWN.map((item) => (
                <Link key={item.href} to={item.href} className="text-white/70 text-sm py-2 pl-3">
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <Link to="/pupil/login" className="text-primary-foreground/70 text-sm py-2">
                Pupil login
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Promo bar */}
      {promoVisible && (
        <div
          className="w-full bg-[#fdf6e3] flex items-center px-[60px] max-sm:px-4 relative"
          style={{ height: "40px" }}
        >
          <span className="block rounded-full bg-[#d92e3a] shrink-0" style={{ width: "8px", height: "8px" }} />
          <span
            className="ml-4 text-[#5a4a1f] font-medium hidden sm:inline"
            style={{ fontSize: "13px" }}
          >
            New Year offer · 10% off intensive courses until 31 January
          </span>
          <span
            className="ml-4 text-[#5a4a1f] font-medium sm:hidden"
            style={{ fontSize: "13px" }}
          >
            10% off intensives
          </span>
          <Link
            to="/courses?type=intensive"
            className="ml-4 text-[#0a1936] font-semibold underline"
            style={{ fontSize: "13px" }}
          >
            Book now →
          </Link>
          <button
            onClick={dismissPromo}
            aria-label="Dismiss promotion"
            className="ml-auto text-[#5a4a1f] hover:text-[#0a1936] p-1"
          >
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      )}
    </header>
  );
}
