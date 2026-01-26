import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Phone, MapPin, Award, CheckCircle2 } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

// Import testimonial images (same as main homepage)
import testimonialSarah from "@/assets/testimonials/sarah.jpg";
import testimonialJames from "@/assets/testimonials/james.jpg";
import testimonialEmma from "@/assets/testimonials/emma.jpg";
import testimonialPriya from "@/assets/testimonials/priya.jpg";
import heroMobile from "@/assets/hero-mobile.png";

interface ContentBlock {
  type: "text" | "features" | "image" | "gallery";
  title?: string;
  content?: string;
  items?: string[];
  image_url?: string;
  images?: string[];
}

interface DemoPage {
  id: string;
  page_type: string;
  page_title: string;
  // Hero section fields
  badge_text: string | null;
  headline_line1: string | null;
  headline_line2: string | null;
  headline_highlight: string | null;
  headline_line3: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  search_placeholder: string | null;
  search_button_text: string | null;
  rating_value: string | null;
  show_finance_badges: boolean | null;
  // Instructor details
  instructor_grade: string | null;
  instructor_name: string | null;
  instructor_phone: string | null;
  instructor_postcode: string | null;
  cpd_certified: boolean | null;
  // CTA section
  cta_heading: string | null;
  cta_subtext: string | null;
  cta_button_text: string | null;
  cta_phone_text: string | null;
  // Content
  content_blocks: ContentBlock[];
  is_published: boolean;
}

export default function DemoMiniSite() {
  const [page, setPage] = useState<DemoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data, error } = await supabase
          .from("demo_mini_website")
          .select("*")
          .eq("page_type", "home")
          .eq("is_published", true)
          .single();

        if (error) throw error;
        setPage({
          ...data,
          content_blocks: (data.content_blocks as unknown as ContentBlock[]) || [],
        });
      } catch (error) {
        console.error("Error fetching demo page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", postcode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12 space-y-8">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-2">Demo Not Available</h1>
          <p className="text-muted-foreground mb-6">
            The demo mini site hasn't been configured yet.
          </p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - EXACT match to main EveryDriver homepage */}
      <section className="relative min-h-[600px] overflow-hidden bg-white py-12 lg:py-20">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              {/* Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
                  {page.badge_text || "Free Re-test"}
                </span>
              </div>

              {/* Main Headline - Exact structure as homepage */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                <span className="text-primary">
                  {page.headline_line1 || "Your Driving"}
                </span>
                <br />
                <span className="text-primary">
                  {page.headline_line2 || "Success"}{" "}
                </span>
                <span className="text-emerald-500">
                  {page.headline_highlight || "Story"}
                </span>
                <br />
                <span className="text-primary">
                  {page.headline_line3 || "Starts Here"}
                </span>
              </h1>

              {/* Subtext */}
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {page.hero_subheading ||
                  "Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster."}
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3">
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={setPostcode}
                  placeholder={page.search_placeholder || "Enter postcode..."}
                  className="flex-1"
                  inputClassName="h-14 rounded-xl border-2 border-border bg-white text-base"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 rounded-xl px-8 text-base font-semibold"
                >
                  {page.search_button_text || "Find Courses"}
                </Button>
              </form>

              {/* Social Proof Row - Exact match */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 font-semibold text-foreground">
                    {page.rating_value || "4.9"}
                  </span>
                </div>
                
                {/* Finance badges */}
                {page.show_finance_badges !== false && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#ffb3c7] px-2 py-1 text-xs font-bold text-black">Klarna.</span>
                    <span className="rounded-md bg-[#b2fce4] px-2 py-1 text-xs font-bold text-black">clearpay</span>
                    <span className="rounded-md bg-[#ffd700] px-2 py-1 text-xs font-bold text-black">iDeal</span>
                    <span className="text-sm text-muted-foreground">0% Finance</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Hero Image - Only visible on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:hidden mt-8"
            >
              <img 
                src={page.hero_image_url || heroMobile} 
                alt="Happy learner driver" 
                className="w-full max-w-sm mx-auto rounded-2xl shadow-lg"
              />
            </motion.div>

            {/* Right Content - Scattered Polaroid Collage (EXACT match) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[480px] lg:h-[540px] hidden md:block"
            >
              {/* Sarah - Top Left Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -12 }}
                animate={{ opacity: 1, y: 0, rotate: -12 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute top-0 left-0 lg:left-4 bg-white p-2 rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] z-10"
              >
                <div className="relative w-40 lg:w-48">
                  <img 
                    src={testimonialSarah} 
                    alt="Sarah" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Sarah</div>
                    <div className="text-muted-foreground text-xs">Passed 1st time! ✨</div>
                  </div>
                </div>
              </motion.div>
              
              {/* James - Top Right Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 8 }}
                animate={{ opacity: 1, y: 0, rotate: 8 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute -top-4 right-24 lg:right-32 bg-white p-2 rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] z-20"
              >
                <div className="relative w-36 lg:w-44">
                  <img 
                    src={testimonialJames} 
                    alt="James" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">James</div>
                    <div className="text-muted-foreground text-xs">Intensive Course 🚗</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Emma - Bottom Center Polaroid (in front) */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -4 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute bottom-0 left-16 lg:left-20 bg-white p-2 rounded-sm shadow-[0_15px_50px_-10px_rgba(0,0,0,0.35)] z-30"
              >
                <div className="relative w-44 lg:w-52">
                  <img 
                    src={testimonialEmma} 
                    alt="Emma" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Emma</div>
                    <div className="text-muted-foreground text-xs">Weekly Lessons 💪</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Priya - Bottom Right Polaroid */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 10 }}
                animate={{ opacity: 1, y: 0, rotate: 10 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="absolute bottom-16 right-8 lg:right-12 bg-white p-2 rounded-sm shadow-[0_12px_45px_-10px_rgba(0,0,0,0.32)] z-25"
              >
                <div className="relative w-32 lg:w-40">
                  <img 
                    src={testimonialPriya} 
                    alt="Priya"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="pt-3 pb-1 text-center">
                    <div className="text-foreground font-semibold text-sm">Priya</div>
                    <div className="text-muted-foreground text-xs">Semi-Intensive 🎉</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Blocks */}
      {page.content_blocks.length > 0 && (
        <section className="container py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {page.content_blocks.map((block, index) => {
              switch (block.type) {
                case "text":
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        {block.title && (
                          <h3 className="text-xl font-semibold mb-3 text-primary">
                            {block.title}
                          </h3>
                        )}
                        {block.content && (
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {block.content}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );

                case "features":
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        {block.title && (
                          <h3 className="text-xl font-semibold mb-4 text-primary">
                            {block.title}
                          </h3>
                        )}
                        {block.items && block.items.length > 0 && (
                          <ul className="space-y-3">
                            {block.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  );

                case "image":
                  return block.image_url ? (
                    <Card key={index} className="overflow-hidden">
                      <img
                        src={block.image_url}
                        alt={block.title || "Image"}
                        className="w-full h-64 object-cover"
                      />
                      {block.title && (
                        <CardContent className="p-4">
                          <p className="text-center text-muted-foreground text-sm">
                            {block.title}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ) : null;

                case "gallery":
                  return block.images && block.images.length > 0 ? (
                    <div key={index}>
                      {block.title && (
                        <h3 className="text-xl font-semibold mb-4 text-primary">
                          {block.title}
                        </h3>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {block.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Gallery image ${i + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null;

                default:
                  return null;
              }
            })}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {page.cta_heading || "Ready to Start Your Driving Journey?"}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {page.cta_subtext || "Book your first lesson today and join thousands of successful drivers."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Calendar className="h-5 w-5 mr-2" />
              {page.cta_button_text || "Book a Lesson"}
            </Button>
            {page.instructor_phone && (
              <a href={`tel:${page.instructor_phone}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  {page.cta_phone_text || "Call Now"}
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            This is a demo mini-site. Content can be edited in the admin CMS.
          </p>
        </div>
      </footer>
    </div>
  );
}
