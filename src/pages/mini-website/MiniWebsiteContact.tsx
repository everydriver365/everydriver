import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { WaitlistJoinCard } from "@/components/mini-website/WaitlistJoinCard";

interface MiniWebsiteContactProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteContact({ subdomainSlug }: MiniWebsiteContactProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "contact");

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const STYLE_OVERRIDES: Record<string, { primaryColor?: string }> = {
    "ken-d": { primaryColor: "#142040" },
  };
  const primaryColor = STYLE_OVERRIDES[slug]?.primaryColor || instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = (instructor.website_heading_color === "#ffffff" || instructor.website_heading_color === "#FFFFFF") ? undefined : instructor.website_heading_color;
  const textColor = (instructor.website_text_color === "#ffffff" || instructor.website_text_color === "#FFFFFF") ? undefined : instructor.website_text_color;

  const CONTACT_OVERRIDES: Record<string, { email?: string; phone?: string; location?: string }> = {
    "ken-d": { email: "info@drive365.co.uk", phone: "07506 782870", location: "Winchester, Southampton, Portsmouth and all surrounding areas" },
  };
  const contactOverride = CONTACT_OVERRIDES[slug] || {};

  const displayPhone = contactOverride.phone || instructor.phone;
  const displayEmail = contactOverride.email || instructor.email;
  const displayLocation = contactOverride.location || instructor.home_postcode;

  const socialLinks = [
    { url: instructor.facebook_url, icon: Facebook, label: "Facebook" },
    { url: instructor.instagram_url, icon: Instagram, label: "Instagram" },
    { url: instructor.twitter_url, icon: Twitter, label: "Twitter" },
    { url: instructor.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { url: instructor.personal_website_url, icon: Globe, label: "Website" },
  ].filter((link) => link.url);

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Contact" pageDescription={`Get in touch with ${instructor.business_name || instructor.name}. Book a driving lesson or ask a question.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Hero */}
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {page.hero_heading || "Get in Touch"}
            </h1>
            <p className="text-lg text-white/90">{page.hero_subheading}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {displayPhone && (
                    <a
                      href={`tel:${displayPhone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{displayPhone}</p>
                      </div>
                    </a>
                  )}

                  {displayEmail && (
                    <a
                      href={`mailto:${displayEmail}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{displayEmail}</p>
                      </div>
                    </a>
                  )}

                  {displayLocation && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Coverage Area</p>
                        <p className="font-medium">{displayLocation}</p>
                      </div>
                    </div>
                  )}

                  {instructor.hourly_rate && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Hourly Rate</p>
                        <p className="font-medium">From £{instructor.hourly_rate}/hour</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
                    Follow Me
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <link.icon className="h-5 w-5" style={{ color: primaryColor }} />
                        <span className="text-sm font-medium">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Book Now / Dynamic Content */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div
                className="p-6 text-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
                <p className="text-white/90 mb-4">
                  Book your first lesson and begin your driving journey today.
                </p>
                <Link to={`/book/${instructor.id}`}>
                  <Button
                    size="lg"
                    className="w-full text-lg"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Book a Lesson
                  </Button>
                </Link>
              </div>
            </Card>

            <PageContentRenderer
              blocks={page.content_blocks}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              headingColor={headingColor}
              textColor={textColor}
            />

            {/* Waitlist card when availability paused */}
            {instructor.availability_paused && (
              <WaitlistJoinCard
                instructorId={instructor.id}
                instructorName={instructor.business_name || instructor.name}
              />
            )}
          </div>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
