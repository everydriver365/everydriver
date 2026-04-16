import { useParams, Link } from "react-router-dom";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Car, Award, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface MiniWebsiteAboutProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteAbout({ subdomainSlug }: MiniWebsiteAboutProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const links = useMiniWebsiteLinks(slug);
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "about");

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

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="About" pageDescription={`Learn about ${instructor.business_name || instructor.name} - your local driving instructor.`} metaTitle={page.meta_title} metaDescription={page.meta_description}>
      {/* Hero */}
      <section
        className="py-6 sm:py-8"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {page.hero_heading || "About Me"}
            </h1>
            <p className="text-lg text-white/90">{page.hero_subheading}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile Card */}
        <Card style={{ backgroundColor: "#e9f4f9" }}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {instructor.profile_image_url ? (
                <img
                  src={instructor.profile_image_url}
                  alt={instructor.name}
                  className="w-32 h-32 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-xl flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {instructor.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                  {instructor.name}
                </h2>
                {instructor.bio && (
                  <p className="text-gray-600 mb-4">{instructor.bio}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {instructor.instructor_grade && (
                    <Badge variant="secondary">Grade {instructor.instructor_grade}</Badge>
                  )}
                  {instructor.cpd_certified && (
                    <Badge variant="secondary">
                      <Award className="h-3 w-3 mr-1" /> CPD Certified
                    </Badge>
                  )}
                  {instructor.adi_code_of_practice && (
                    <Badge variant="secondary">ADI Code of Practice</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        {(instructor.car_make || instructor.car_model) && (
          <Card style={{ backgroundColor: "#e9f4f9" }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
                Training Vehicle
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {instructor.car_image_url && (
                  <img
                    src={instructor.car_image_url}
                    alt="Training vehicle"
                    className="w-full sm:w-48 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium">
                      {instructor.car_make} {instructor.car_model}
                    </span>
                  </div>
                  <Badge style={{ backgroundColor: secondaryColor }} className="text-white">
                    {instructor.car_type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Content */}
        <PageContentRenderer
          blocks={page.content_blocks}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          headingColor={headingColor}
          textColor={textColor}
        />

        {/* CTA */}
        <div className="text-center pt-6">
          <Link to={links.contact}>
            <Button size="lg" style={{ backgroundColor: primaryColor }} className="text-white">
              <Calendar className="h-5 w-5 mr-2" />
              Book Your First Lesson
            </Button>
          </Link>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
