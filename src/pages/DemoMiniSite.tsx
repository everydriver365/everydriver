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
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  content_blocks: ContentBlock[];
  is_published: boolean;
}

// Demo instructor data
const demoInstructor = {
  name: "Demo Driving School",
  phone: "07700 900123",
  home_postcode: "SW1A 1AA",
  instructor_grade: "A",
  cpd_certified: true,
  brand_colour: "#1e3a5f",
  secondary_colour: "#10b981",
};

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
    // Demo search - would navigate to courses in real implementation
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
      {/* Hero Section - Matching EveryDriver Main Page Design */}
      <section className="relative min-h-[600px] overflow-hidden bg-background py-12 lg:py-20">
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
                  <Award className="h-4 w-4 mr-1" />
                  Grade {demoInstructor.instructor_grade} Instructor
                </span>
              </div>

              {/* Main Headline - Split with highlight */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                <span className="text-primary">
                  {page.hero_heading?.split(" ").slice(0, 2).join(" ") || "Welcome to"}
                </span>
                <br />
                <span className="text-emerald-500">
                  {page.hero_heading?.split(" ").slice(2, 4).join(" ") || "Demo"}
                </span>
                <br />
                <span className="text-primary">
                  {page.hero_heading?.split(" ").slice(4).join(" ") || "Driving School"}
                </span>
              </h1>

              {/* Subtext */}
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {page.hero_subheading ||
                  "Professional driving instruction tailored to your needs. Learn to drive with confidence."}
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3">
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={setPostcode}
                  placeholder="Enter postcode..."
                  className="flex-1"
                  inputClassName="h-14 rounded-xl border-2 border-border bg-background text-base"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 rounded-xl px-8 text-base font-semibold"
                >
                  Find Lessons
                </Button>
              </form>

              {/* Social Proof Row */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 font-semibold text-foreground">4.9</span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {demoInstructor.home_postcode}
                </Badge>
                {demoInstructor.cpd_certified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    CPD Certified
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:block"
            >
              {page.hero_image_url ? (
                <img
                  src={page.hero_image_url}
                  alt="Demo Driving School"
                  className="w-full h-[480px] object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-[480px] bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🚗</div>
                    <p className="text-lg text-muted-foreground">Demo Driving School</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Blocks */}
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

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Book your first lesson today and join thousands of successful drivers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Calendar className="h-5 w-5 mr-2" />
              Book a Lesson
            </Button>
            <a href={`tel:${demoInstructor.phone}`}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Now
              </Button>
            </a>
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
