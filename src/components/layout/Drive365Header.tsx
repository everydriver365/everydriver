import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLogo } from "@/hooks/useRouteLogo";

const NAV_LINKS = [
  { href: "/drive365", label: "Home" },
  { href: "/courses", label: "Courses", hasDropdown: true },
  { href: "/theory", label: "Theory practice" },
  { href: "/test-swap", label: "Test Swap" },
  { href: "/drive365/franchise", label: "Franchise" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
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
  const [scrolled, setScrolled] = useState(false);
  const coursesRef = useRef<HTMLDivElement | null>(null);
  const { logo, logoAlt, homeLink } = useRouteLogo();

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
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className="sticky top-0 z-[100] w-full">
      {/* Main bar */}
      <div
        className={cn(
          "w-full bg-[#0A1628] transition-shadow duration-200",
          scrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
        )}
      >
        <div className="mx-auto flex h-[56px] items-center justify-between px-[28px] max-lg:px-5">
          {/* Logo — EveryDriver wordmark */}
          <Link to={homeLink} className="flex items-center shrink-0" aria-label="EveryDriver home">
            <img src={logo} alt={logoAlt} className="h-7 -mx-1" />
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center" style={{ gap: 22 }}>
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              if (link.hasDropdown) {
                return (
                  <div key={link.href} className="relative" ref={coursesRef}>
                    <button
                      type="button"
                      onClick={() => setCoursesOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={coursesOpen}
                      className="relative flex items-center gap-1 transition-colors text-white/70 hover:text-white"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          coursesOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {coursesOpen && (
                      <div className="absolute left-0 top-full pt-3 z-50">
                        <div className="bg-white rounded-lg shadow-xl py-2 min-w-[220px]">
                          {COURSES_DROPDOWN.map((item) => (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setCoursesOpen(false)}
                              className="block px-4 py-2 text-sm text-[#0a1936] hover:bg-[#0F2044]/10 hover:text-[#0F2044] transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative transition-colors",
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  )}
                  style={{ fontSize: 13, fontWeight: isActive ? 600 : 500 }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side (desktop) */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <Link
              to="/drive365/login"
              className="transition-colors hover:text-white"
              style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}
            >
              Pupil login
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center text-white transition-colors hover:brightness-110"
              style={{
                background: "#E8641A",
                border: "none",
                borderRadius: 6,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Find courses
            </Link>
          </div>

          {/* Mobile right side */}
          <div className="flex lg:hidden items-center gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center text-white transition-colors hover:brightness-110"
              style={{
                background: "#E8641A",
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 700,
              }}
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
          <div className="lg:hidden border-t border-white/10 bg-[#0A1628]">
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
              <Link to="/drive365/login" className="text-white/70 text-sm py-2">
                Pupil login
              </Link>
            </div>
          </div>
        )}
      </div>


      {/* Promo bar removed — managed via admin CMS PromoBanner */}
    </header>
  );
}
