import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useRouteLogo } from "@/hooks/useRouteLogo";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import { getAreasForHost, areaToSlug } from "@/lib/whitelabelAreas";
import dsmLogo from "@/assets/dsm-logo.png";

// Decorative tyre track SVG pattern
function TyreTrackPattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-48 md:w-72 lg:w-96 opacity-[0.08] pointer-events-none"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMaxYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left track */}
      <g fill="currentColor">
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`left-${i}`} transform={`translate(40, ${i * 30})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
      {/* Right track */}
      <g fill="currentColor">
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`right-${i}`} transform={`translate(110, ${i * 30 + 15})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Footer() {
  const { logo, logoAlt, logoText, homeLink } = useRouteLogo();
  const whitelabel = getWhitelabelConfig();
  const contactPhone = whitelabel?.phone ?? "0800 123 4567";
  const contactEmail = whitelabel?.email ?? "hello@drivetime.co.uk";
  const contactArea = whitelabel?.address ?? "Covering all UK postcodes";
  const copyrightName = whitelabel?.brandName ?? "Drive365";
  const wlAreas = whitelabel ? getAreasForHost(whitelabel.host) : [];
  const { pathname } = useLocation();
  const isDrive365Home = pathname === "/drive365" || pathname === "/drive365/";

  return (
    <>
      {isDrive365Home && (
        <footer className="hidden md:block bg-[#0A0E27] overflow-hidden">
          <div style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "32px" }}>
            <div>
              <Link to={homeLink} className="inline-flex items-center gap-1" aria-label="DSM">
                <img src={dsmLogo} alt="DSM" style={{ height: 28 }} />
              </Link>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1.5, marginTop: 10, marginBottom: 12 }}>
                Professional driving instruction to help you pass your test with confidence.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {[Facebook, Instagram, Twitter].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>
                    <Icon style={{ width: 11, height: 11 }} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Quick Links</h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { to: "/courses", label: "Find Courses" },
                  { to: "/test-swap", label: "Test Swap" },
                  { to: "/about", label: "About Us" },
                  { to: "/pricing", label: "Pricing" },
                  { to: "/faq", label: "FAQ" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>{l.label}</Link>
                  </li>
                ))}
                <li><Link to="/instructor-app/login" style={{ color: "#1A6FD4", fontSize: 10, fontWeight: 700 }}>EveryDriver </Link></li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Portals</h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { to: "/drive365", label: "Drive365 Learners" },
                  { to: "/pupil/login", label: "Pupil Portal" },
                  { to: "/instructor-app/login", label: "Instructor Portal" },
                  { to: "/admin/login", label: "Admin Portal" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>{l.label}</Link>
                  </li>
                ))}
                
              </ul>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Contact Us</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Phone style={{ width: 11, height: 11, color: "rgba(255,255,255,0.4)" }} />
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{contactPhone}</a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Mail style={{ width: 11, height: 11, color: "rgba(255,255,255,0.4)" }} />
                <a href={`mailto:${contactEmail}`} style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{contactEmail}</a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin style={{ width: 11, height: 11, color: "rgba(255,255,255,0.4)" }} />
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{contactArea}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
          <div style={{ background: "#FFFFFF", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9CA3AF", fontSize: 10 }}>© {new Date().getFullYear()} {copyrightName}. All rights reserved.</span>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { to: "/privacy-policy", label: "Privacy Policy" },
                { to: "/terms-of-service", label: "Terms of Use" },
                { to: "/cookie-policy", label: "Cookie Policy" },
              ].map((l) => (
                <Link key={l.to} to={l.to} style={{ color: "#9CA3AF", fontSize: 10 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0A0E27")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}>{l.label}</Link>
              ))}
            </div>
          </div>
        </footer>
      )}

      <footer className={`relative border-t bg-primary text-primary-foreground overflow-hidden ${isDrive365Home ? "md:hidden" : ""}`}>
      {/* Tyre track decoration - hidden on small screens */}
      <div className="hidden sm:block">
        <TyreTrackPattern />
      </div>

      <div className="container relative z-10 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to={homeLink} className="flex items-center gap-2">
              <img src={logo} alt={logoAlt} className="h-10 -mx-1" />
              {logoText && <span className="text-sm font-semibold text-primary-foreground">{logoText}</span>}
            </Link>
            <p className="text-sm text-primary-foreground/70">
              Professional driving instruction to help you pass your test with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/courses" className="hover:text-accent">Find Courses</Link></li>
              <li><Link to="/test-swap" className="hover:text-accent">Test Swap</Link></li>
              <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
              <li><Link to="/pricing" className="hover:text-accent">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-accent">FAQ</Link></li>
              <li><Link to="/instructor-app/login" className="hover:text-accent font-medium text-accent">EveryDriver </Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="mb-4 font-semibold">Portals</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/drive365" className="hover:text-accent">Drive365 Learners</Link></li>
              <li><Link to="/pupil/login" className="hover:text-accent">Pupil Portal</Link></li>
              <li><Link to="/instructor-app/login" className="hover:text-accent">Instructor Portal</Link></li>
              <li><Link to="/admin/login" className="hover:text-accent">Admin Portal</Link></li>
              
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-accent">{contactPhone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${contactEmail}`} className="hover:text-accent break-all">{contactEmail}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{contactArea}</span>
              </li>
            </ul>
          </div>
        </div>

        {whitelabel && wlAreas.length > 0 && (
          <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/50 leading-relaxed">
            <span className="text-primary-foreground/70">Serving: </span>
            {wlAreas.map((area, i) => (
              <span key={area}>
                <Link
                  to={`/areas/${areaToSlug(area)}`}
                  className="hover:text-accent"
                >
                  {area}
                </Link>
                {i < wlAreas.length - 1 && <span className="mx-1.5">·</span>}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} {copyrightName}. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4 flex-wrap">
            <a href="/privacy-policy" className="hover:text-accent">Privacy Policy</a>
            <span>|</span>
            <Link to="/terms-of-service" className="hover:text-accent">Terms of Service</Link>
            <span>|</span>
            <Link to="/instructor-app/login" className="hover:text-accent">Instructor login</Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
