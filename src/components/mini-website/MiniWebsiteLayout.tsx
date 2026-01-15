import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Instructor {
  id: string;
  name: string;
  app_slug: string;
  logo_url?: string | null;
  brand_colour?: string | null;
  secondary_colour?: string | null;
  phone?: string | null;
  email?: string | null;
  home_postcode?: string;
  personal_website_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
}

interface MiniWebsiteLayoutProps {
  instructor: Instructor;
  children: React.ReactNode;
}

export function MiniWebsiteLayout({ instructor, children }: MiniWebsiteLayoutProps) {
  const location = useLocation();
  const slug = instructor.app_slug;
  const primaryColor = instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";

  const navLinks = [
    { path: `/i/${slug}`, label: "Home" },
    { path: `/i/${slug}/about`, label: "About" },
    { path: `/i/${slug}/services`, label: "Services" },
    { path: `/i/${slug}/reviews`, label: "Reviews" },
    { path: `/i/${slug}/contact`, label: "Contact" },
  ];

  const isActive = (path: string) => {
    if (path === `/i/${slug}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={`/i/${slug}`} className="flex items-center gap-3">
              {instructor.logo_url ? (
                <img
                  src={instructor.logo_url}
                  alt={instructor.name}
                  className="h-10 w-auto object-contain bg-white rounded p-1"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {instructor.name.charAt(0)}
                </div>
              )}
              <span className="text-white font-semibold text-lg hidden sm:block">
                {instructor.name}
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
                {instructor.phone && (
                  <a
                    href={`tel:${instructor.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {instructor.phone}
                  </a>
                )}
                {instructor.email && (
                  <a
                    href={`mailto:${instructor.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {instructor.email}
                  </a>
                )}
                {instructor.home_postcode && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {instructor.home_postcode}
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
              <a href="/" className="hover:text-white transition-colors">
                EveryDriver
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
