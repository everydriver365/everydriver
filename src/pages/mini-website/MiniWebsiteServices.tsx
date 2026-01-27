import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Course {
  id: string;
  course_name: string;
  course_hours: number;
  discounted_price: number | null;
  course_image_url: string | null;
  custom_features: string[] | null;
}

interface MiniWebsiteServicesProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteServices({ subdomainSlug }: MiniWebsiteServicesProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "services");
  const links = useMiniWebsiteLinks(slug);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (instructor?.id) {
      supabase
        .from("instructor_courses")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data) setCourses(data);
        });
    }
  }, [instructor?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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

  const primaryColor = instructor.brand_colour || "#1e3a5f";
  const secondaryColor = instructor.secondary_colour || "#d4a574";
  const headingColor = instructor.website_heading_color;
  const textColor = instructor.website_text_color;

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Hero */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {page.hero_heading || "Our Services"}
            </h1>
            <p className="text-lg text-white/90">{page.hero_subheading}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Dynamic Content */}
        <PageContentRenderer
          blocks={page.content_blocks}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          headingColor={headingColor}
          textColor={textColor}
        />

        {/* Courses Grid */}
        {courses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
              Available Courses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full" style={{ backgroundColor: "#e9f4f9" }}>
                    {course.course_image_url && (
                      <img
                        src={course.course_image_url}
                        alt={course.course_name}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-2">{course.course_name}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.course_hours} hours
                        </span>
                        {course.discounted_price && (
                          <span className="text-xl font-bold" style={{ color: primaryColor }}>
                            £{course.discounted_price}
                          </span>
                        )}
                      </div>
                      {course.custom_features && course.custom_features.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {course.custom_features.slice(0, 4).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2
                                className="h-4 w-4 mt-0.5 flex-shrink-0"
                                style={{ color: secondaryColor }}
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link to={`/book/${instructor.id}`}>
                        <Button
                          className="w-full text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Book Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {courses.length === 0 && (
          <Card style={{ backgroundColor: "#e9f4f9" }}>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                Contact me directly to discuss available courses and packages.
              </p>
              <Link to={links.contact}>
                <Button style={{ backgroundColor: primaryColor }} className="text-white">
                  Get in Touch
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </MiniWebsiteLayout>
  );
}
