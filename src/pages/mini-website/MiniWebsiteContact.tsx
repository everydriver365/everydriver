import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Calendar, Clock, Loader2, CheckCircle, FileEdit, Car } from "lucide-react";
import { motion } from "framer-motion";
import { WaitlistJoinCard } from "@/components/mini-website/WaitlistJoinCard";
import { BespokeEnquiryForm } from "@/components/BespokeEnquiryForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MiniWebsiteContactProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteContact({ subdomainSlug }: MiniWebsiteContactProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const isCallback = type === "callback";
  const isBespoke = type === "bespoke";

  const { page, instructor, loading, notFound } = useWebsitePage(slug, "contact");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("create-enquiry", {
        body: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          address: formData.email || "No email provided",
          postcode: formData.phone || "No phone provided",
          courseType: "callback",
          requestedHours: 0,
          preferredTiming: "flexible",
          additionalNotes: formData.message || null,
          assignedInstructorId: instructor?.id || null,
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast.success("Callback request submitted! We'll be in touch soon.");
    } catch (error) {
      console.error("Error submitting callback request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Link to={`/i/${slug}`}>
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

  const displayPhone = instructor.phone;
  const displayEmail = instructor.email;
  const displayLocation = instructor.location_name || instructor.home_postcode;

  const socialLinks = [
    { url: instructor.facebook_url, icon: Facebook, label: "Facebook" },
    { url: instructor.instagram_url, icon: Instagram, label: "Instagram" },
    { url: instructor.twitter_url, icon: Twitter, label: "Twitter" },
    { url: instructor.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { url: instructor.personal_website_url, icon: Globe, label: "Website" },
  ].filter((link) => link.url);

  // Hero title based on type
  const heroTitle = isCallback
    ? "Request a Callback"
    : isBespoke
    ? "Bespoke Course Request"
    : page.hero_heading || "Get in Touch";

  const heroSubtitle = isCallback
    ? "Leave your details and we'll call you back"
    : isBespoke
    ? "Tell us what you're looking for and we'll create the perfect course"
    : page.hero_subheading;

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Contact" pageDescription={`Get in touch with ${instructor.business_name || instructor.name}. Book a driving lesson or ask a question.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Hero */}
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="mb-3">
              {isCallback ? (
                <Phone className="h-10 w-10 mx-auto mb-2" />
              ) : isBespoke ? (
                <FileEdit className="h-10 w-10 mx-auto mb-2" />
              ) : null}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {heroTitle}
            </h1>
            <p className="text-lg text-white/90">{heroSubtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {/* Callback Form */}
        {isCallback && (
          <div className="max-w-lg mx-auto">
            {isSubmitted ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                  <p className="text-gray-600">
                    Your callback request has been submitted. We'll call you back as soon as possible.
                  </p>
                  <Link to={`/i/${slug}/contact`}>
                    <Button className="mt-6 text-white" style={{ backgroundColor: primaryColor }}>
                      Back to Contact
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                    Request a Callback
                  </h2>
                  <form className="space-y-4" onSubmit={handleCallbackSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name *</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name *</Label>
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07123 456789"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">What would you like to discuss? (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us briefly what you'd like to talk about..."
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full text-white"
                      style={{ backgroundColor: primaryColor }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Request Callback"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Bespoke Form */}
        {isBespoke && (
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                  Request a Bespoke Course
                </h2>
                <BespokeEnquiryForm />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Default Contact Page */}
        {!isCallback && !isBespoke && (
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
                  <Link to={`/i/${slug}/contact`}>
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
        )}
      </section>
    </MiniWebsiteLayout>
  );
}