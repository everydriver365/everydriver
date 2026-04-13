import { ReactNode, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Menu, X, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchoolData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_tier: string | null;
  website_theme: string | null;
  website_font: string | null;
  website_button_color: string | null;
  hero_image_url: string | null;
}

interface SchoolWebsiteLayoutProps {
  children: (school: SchoolData) => ReactNode;
  pageType?: string;
}

export default function SchoolWebsiteLayout({ children, pageType }: SchoolWebsiteLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, description, logo_url, brand_colour, contact_email, contact_phone, website_tier, website_theme, website_font, website_button_color, hero_image_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setSchool(data as SchoolData);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">School Not Found</h1>
          <p className="text-muted-foreground">This school page doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isMultiPage = school.website_tier === "multi_page";
  const brandColor = school.brand_colour || "#3b82f6";
  const buttonColor = school.website_button_color || brandColor;

  const navLinks = [
    { label: "Home", path: `/school/${slug}` },
    { label: "About", path: `/school/${slug}/about` },
    { label: "Instructors", path: `/school/${slug}/instructors` },
    { label: "Contact", path: `/school/${slug}/contact` },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: school.website_font === "inter" ? "Inter, sans-serif" : school.website_font || "Inter, sans-serif" }}>
      {/* Header */}
      {isMultiPage && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 flex items-center justify-between h-16">
            <Link to={`/school/${slug}`} className="flex items-center gap-3">
              {school.logo_url && (
                <img src={school.logo_url} alt={school.name} className="h-10 w-auto object-contain" />
              )}
              <span className="font-bold text-lg" style={{ color: brandColor }}>{school.name}</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {school.contact_phone && (
                <a href={`tel:${school.contact_phone}`}>
                  <Button size="sm" style={{ backgroundColor: buttonColor, borderColor: buttonColor }} className="text-white">
                    <Phone className="h-4 w-4 mr-1" /> Call Us
                  </Button>
                </a>
              )}
            </nav>

            {/* Mobile toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Single-page header (minimal) */}
      {!isMultiPage && (
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {school.logo_url && (
                <img src={school.logo_url} alt={school.name} className="h-10 w-auto object-contain" />
              )}
              <span className="font-bold text-lg" style={{ color: brandColor }}>{school.name}</span>
            </div>
            {school.contact_phone && (
              <a href={`tel:${school.contact_phone}`}>
                <Button size="sm" style={{ backgroundColor: buttonColor, borderColor: buttonColor }} className="text-white">
                  <Phone className="h-4 w-4 mr-1" /> Call Us
                </Button>
              </a>
            )}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1">
        {children(school)}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {school.logo_url && (
                <img src={school.logo_url} alt={school.name} className="h-8 w-auto object-contain" />
              )}
              <span className="font-semibold" style={{ color: brandColor }}>{school.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {school.contact_email && (
                <a href={`mailto:${school.contact_email}`} className="flex items-center gap-1 hover:text-foreground">
                  <Mail className="h-4 w-4" /> {school.contact_email}
                </a>
              )}
              {school.contact_phone && (
                <a href={`tel:${school.contact_phone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-4 w-4" /> {school.contact_phone}
                </a>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} {school.name}. Powered by Driving School Manager.
          </p>
        </div>
      </footer>

      {/* Single-page upgrade banner */}
      {!isMultiPage && pageType === "home" && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary/95 text-primary-foreground py-3 px-4 text-center text-sm z-50 backdrop-blur">
          Want more pages for your school website? <span className="font-semibold">Upgrade to Multi-Page</span> in your School Manager portal.
        </div>
      )}
    </div>
  );
}
