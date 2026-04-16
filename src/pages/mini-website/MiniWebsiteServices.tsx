import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { PageContentRenderer } from "@/components/mini-website/PageContentRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, Tag, X, Loader2 , Car } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ClearpayInstalmentBadge } from "@/components/payments/ClearpayOSMWidget";
import klarnaLogo from "@/assets/klarna-logo.svg";

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
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: string; value: number; code: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [discountError, setDiscountError] = useState("");

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

  const validateDiscount = async () => {
    if (!discountCode.trim() || !instructor?.id) return;
    setValidating(true);
    setDiscountError("");
    try {
      const { data, error } = await supabase
        .from("instructor_discount_codes")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("code", discountCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setDiscountError("Invalid code"); setValidating(false); return; }
      if (data.valid_until && new Date(data.valid_until) < new Date()) { setDiscountError("Code expired"); setValidating(false); return; }
      if (data.valid_from && new Date(data.valid_from) > new Date()) { setDiscountError("Code not yet valid"); setValidating(false); return; }
      if (data.max_uses && (data.times_used ?? 0) >= data.max_uses) { setDiscountError("Code fully redeemed"); setValidating(false); return; }

      setAppliedDiscount({ type: data.discount_type, value: data.discount_value, code: data.code });
    } catch {
      setDiscountError("Could not validate code");
    }
    setValidating(false);
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedDiscount) return price;
    if (appliedDiscount.type === "percentage") return Math.max(0, price - (price * appliedDiscount.value / 100));
    return Math.max(0, price - appliedDiscount.value);
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

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Services" pageDescription={`Driving lesson services offered by ${instructor.business_name || instructor.name}. View packages and prices.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Hero */}
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
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

        {/* Discount Code Input */}
        {courses.length > 0 && (
          <div className="rounded-lg border p-4" style={{ borderColor: `${primaryColor}33` }}>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4" style={{ color: primaryColor }} />
              <span className="text-sm font-medium">Have a discount code?</span>
            </div>
            {appliedDiscount ? (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  {appliedDiscount.code} applied — {appliedDiscount.type === "percentage" ? `${appliedDiscount.value}% off` : `£${appliedDiscount.value} off`}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
                  placeholder="Enter code"
                  className="font-mono text-sm"
                  onKeyDown={(e) => e.key === "Enter" && validateDiscount()}
                />
                <Button size="sm" onClick={validateDiscount} disabled={validating || !discountCode.trim()} style={{ backgroundColor: primaryColor }} className="text-white">
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
            {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
          </div>
        )}

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
                          <div className="flex items-center gap-1.5">
                            {appliedDiscount && getDiscountedPrice(course.discounted_price) < course.discounted_price && (
                              <span className="text-sm line-through text-gray-400">£{course.discounted_price}</span>
                            )}
                            <span className="text-xl font-bold" style={{ color: primaryColor }}>
                              £{appliedDiscount ? getDiscountedPrice(course.discounted_price).toFixed(2) : course.discounted_price}
                            </span>
                          </div>
                        )}
                      </div>
                      {course.discounted_price && (instructor as any).klarna_enabled && (
                        <div className="flex items-center gap-2 mb-1">
                          <img src={klarnaLogo} alt="Klarna" className="h-4 w-4" />
                          <span className="text-xs text-gray-600">
                            3 × £{(course.discounted_price / 3).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {course.discounted_price && (instructor as any).clearpay_enabled && (
                        <ClearpayInstalmentBadge amount={course.discounted_price} />
                      )}
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
                      <Link to={links.contact}>
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
