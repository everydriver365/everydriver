import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Globe, Menu, X } from "lucide-react";
import { MiniWebsiteSecondaryNav } from "@/components/mini-website/MiniWebsiteSecondaryNav";
import { MiniWebsiteMobileBottomNav } from "@/components/mini-website/MiniWebsiteMobileBottomNav";
import { Button } from "@/components/ui/button";
import { WhatsAppChatWidget } from "@/components/whatsapp/WhatsAppChatWidget";
import { useMiniWebsiteSEO } from "@/hooks/useMiniWebsiteSEO";

interface Instructor {
  id: string;
  name: string;
  business_name?: string | null;
  app_slug: string;
  logo_url?: string | null;
  brand_colour?: string | null;
  secondary_colour?: string | null;
  website_theme?: string | null;
  website_font?: string | null;
  website_header_style?: string | null;
  website_header_bg?: string | null;
  website_button_color?: string | null;
  website_footer_bg?: string | null;
  website_text_color?: string | null;
  website_heading_color?: string | null;
  website_menu_text_color?: string | null;
  phone?: string | null;
  email?: string | null;
  home_postcode?: string;
  personal_website_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
}

interface FooterOverrides {
  email?: string;
  phone?: string;
  location?: string;
}

interface MiniWebsiteLayoutProps {
  instructor: Instructor;
  children: React.ReactNode;
  footerOverrides?: FooterOverrides;
  pageTitle?: string;
  pageDescription?: string;
  /** Per-page meta_title override from admin CMS */
  metaTitle?: string | null;
  /** Per-page meta_description override from admin CMS */
  metaDescription?: string | null;
}

export function MiniWebsiteLayout({ instructor, children, footerOverrides, pageTitle, pageDescription, metaTitle, metaDescription }: MiniWebsiteLayoutProps) {
  const location = useLocation();
  const slug = instructor.app_slug;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SEO meta tags, JSON-LD, canonical URL
  useMiniWebsiteSEO({ instructor, pageTitle, pageDescription, metaTitle, metaDescription });

  // Per-instructor footer contact overrides
  const FOOTER_CONTACT_OVERRIDES: Record<string, FooterOverrides> = {
    "ken-d": { email: "info@drive365.co.uk", phone: "07506 782870", location: "Winchester" },
  };
  const resolvedFooterOverrides = { ...FOOTER_CONTACT_OVERRIDES[slug], ...footerOverrides };

  // Per-instructor style overrides (highest priority)
  const STYLE_OVERRIDES: Record<string, { primaryColor?: string; headerBg?: string; footerBg?: string }> = {
    "ken-d": { primaryColor: "#142040", headerBg: "#142040", footerBg: "#142040" },
  };
  const styleOverride = STYLE_OVERRIDES[slug] || {};

  const primaryColor = styleOverride.primaryColor || instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#3b82f6";
  const headerBg = styleOverride.headerBg || instructor.website_header_bg || primaryColor;
  const buttonColor = instructor.website_button_color || secondaryColor;
  const footerBg = styleOverride.footerBg || instructor.website_footer_bg || primaryColor;
  const fontFamily = instructor.website_font || "Inter";
  const headerStyle = instructor.website_header_style || "solid";
  const menuTextColor = instructor.website_menu_text_color || "#ffffff";

  const navLinks = [
    { path: `/i/${slug}`, label: "Home" },
    { path: `/i/${slug}/about`, label: "About" },
    { path: `/i/${slug}/courses`, label: "Courses" },
    { path: `/i/${slug}/tests`, label: "Tests" },
    { path: `/i/${slug}/reviews`, label: "Reviews" },
    { path: `/i/${slug}/contact`, label: "Contact" },
  ];

  const isActive = (path: string) => {
    if (path === `/i/${slug}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Calculate header styles based on headerStyle setting
  const getHeaderStyles = () => {
    switch (headerStyle) {
      case "transparent":
        return {
          backgroundColor: "transparent",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        };
      case "gradient":
        return {
          background: `linear-gradient(135deg, ${headerBg} 0%, ${secondaryColor} 100%)`,
        };
      default:
        return {
          backgroundColor: headerBg,
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily, backgroundColor: '#e9f4f9' }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
      `}</style>
      
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={getHeaderStyles()}
      >
        <div className="max-w-5xl mx-auto px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Link to={`/i/${slug}`} className="flex items-center gap-2 sm:gap-3">
              {instructor.logo_url ? (
                <img
                  src={instructor.logo_url}
                  alt={instructor.name}
                  className="h-8 sm:h-12 w-auto object-contain rounded p-1"
                />
              ) : (
                <div
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {instructor.name.charAt(0)}
                </div>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-white/20"
                      : "hover:bg-white/10"
                  }`}
                  style={{ 
                    color: isActive(link.path) ? "#facc15" : "#ffffff",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-2 pb-3 border-t border-white/10 mt-2 grid grid-cols-2 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-center ${
                    isActive(link.path)
                      ? "bg-white/20"
                      : "hover:bg-white/10"
                  }`}
                  style={{ 
                    color: isActive(link.path) ? "#facc15" : "#ffffff",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Secondary Nav — hidden on mobile */}
      <div className="hidden md:block">
        <MiniWebsiteSecondaryNav slug={slug} />
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* Footer */}
      <footer className="text-white py-12" style={{ backgroundColor: footerBg }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{instructor.name}</h3>
              <p className="text-gray-400 text-sm">
                Professional driving instruction to help you pass your test with confidence.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-gray-400">
                {(resolvedFooterOverrides?.phone || instructor.phone) && (
                  <a
                    href={`tel:${resolvedFooterOverrides?.phone || instructor.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {resolvedFooterOverrides?.phone || instructor.phone}
                  </a>
                )}
                {(resolvedFooterOverrides?.email || instructor.email) && (
                  <a
                    href={`mailto:${resolvedFooterOverrides?.email || instructor.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {resolvedFooterOverrides?.email || instructor.email}
                  </a>
                )}
                {(resolvedFooterOverrides?.location || instructor.home_postcode) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {resolvedFooterOverrides?.location || instructor.home_postcode}
                  </div>
                )}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
              <div className="flex items-center gap-3">
                {instructor.facebook_url && (
                  <a
                    href={instructor.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {instructor.instagram_url && (
                  <a
                    href={instructor.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {instructor.twitter_url && (
                  <a
                    href={instructor.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {instructor.linkedin_url && (
                  <a
                    href={instructor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {instructor.personal_website_url && (
                  <a
                    href={instructor.personal_website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {instructor.name}. All rights reserved.</p>
            <p className="mt-1">
              Powered by{" "}
              <Link to={`/i/${instructor.app_slug}`} className="hover:text-white transition-colors">
                Drive365
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <MiniWebsiteMobileBottomNav slug={slug} />

      {/* Chat Widget */}
      <WhatsAppChatWidget
        instructorId={instructor.id}
        instructorName={instructor.name}
        primaryColor={instructor.brand_colour || undefined}
      />
    </div>
  );
}
