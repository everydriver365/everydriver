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
    <header className="sticky top-0 z-[100] w-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Main bar */}
      <div
        className={cn(
          "w-full bg-[#0F2044] transition-shadow duration-200",
          scrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
        )}
      >
        <div className="mx-auto flex h-[64px] items-center justify-between" style={{ padding: "0 1.5rem" }}>
          {/* Logo — EveryDriver wordmark */}
          <Link to={homeLink} className="flex items-center shrink-0" aria-label="EveryDriver home">
            <img src={logo} alt={logoAlt} style={{ height: 28 }} />
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center" style={{ gap: "1.75rem" }}>
            {NAV_LINKS.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.href} className="relative" ref={coursesRef}>
                    <button
                      type="button"
                      onClick={() => setCoursesOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={coursesOpen}
                      className="relative flex items-center gap-1 transition-colors hover:!text-white"
                      style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", fontFamily: "'Poppins', sans-serif" }}
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
                              className="block px-4 py-2 text-sm text-[#0F2044] hover:bg-[#0F2044]/10 transition-colors"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
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
                  className="relative transition-colors hover:!text-white"
                  style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", fontFamily: "'Poppins', sans-serif" }}
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
              className="transition-colors hover:!text-white"
              style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", fontFamily: "'Poppins', sans-serif" }}
            >
              Pupil login
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center text-white transition-colors"
              style={{
                background: "#D12E2E",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b52626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D12E2E")}
            >
              Find courses
            </Link>
          </div>

          {/* Mobile right side */}
          <div className="flex lg:hidden items-center gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center text-white transition-colors"
              style={{
                background: "#D12E2E",
                borderRadius: 8,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b52626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D12E2E")}
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
          <div className="lg:hidden border-t border-white/10 bg-[#0F2044]" style={{ fontFamily: "'Poppins', sans-serif" }}>
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


      {/* Secondary nav bar */}
      <div
        className="w-full"
        style={{
          background: "#ffffff",
          borderBottom: "1.5px solid #e8edf2",
          height: 46,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            height: "100%",
            gap: "2rem",
            padding: "0 1.5rem",
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none",
          }}
        >
          {[
            { href: "/contact?type=callback", label: "Request a Callback" },
            { href: "/contact?type=bespoke", label: "Bespoke Course Request" },
            { href: "/courses", label: "Plan a Course" },
            { href: "/test-swap", label: "Test Swap" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="d365-subnav-link"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0F2044",
                fontFamily: "'Poppins', sans-serif",
                borderBottom: "2px solid transparent",
                padding: "12px 0",
                transition: "color 120ms ease, border-color 120ms ease",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <style>{`
          .d365-subnav-link:hover { color: #D12E2E !important; border-bottom-color: #D12E2E !important; }
        `}</style>
      </div>

      {/* Promo bar removed — managed via admin CMS PromoBanner */}
    </header>
  );
}
