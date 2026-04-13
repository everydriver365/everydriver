import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SchoolWebsiteLayout from "./SchoolWebsiteLayout";

interface ContentBlock {
  type: "text" | "features";
  title?: string;
  content?: string;
  items?: string[];
}

interface InstructorCard {
  id: string;
  name: string;
  phone: string;
  lesson_rate: number;
  profile_image_url: string | null;
  postcode: string | null;
  transmission_type: string | null;
  bio: string | null;
  slug: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

export default function SchoolWebsiteHome() {
  const { slug } = useParams<{ slug: string }>();
  const [instructors, setInstructors] = useState<InstructorCard[]>([]);
  const [page, setPage] = useState<{ hero_heading: string | null; hero_subheading: string | null; content_blocks: ContentBlock[] } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      // Get school
      const { data: school } = await supabase.from("schools").select("id").eq("slug", slug).maybeSingle();
      if (!school) return;

      // Get page content
      const { data: pageData } = await supabase
        .from("school_website_pages")
        .select("hero_heading, hero_subheading, content_blocks")
        .eq("school_id", school.id)
        .eq("page_type", "home")
        .eq("is_published", true)
        .maybeSingle();
      if (pageData) {
        setPage({
          ...pageData,
          content_blocks: (pageData.content_blocks as unknown as ContentBlock[]) || [],
        });
      }

      // Get instructors
      const { data: links } = await supabase.from("school_instructors").select("instructor_id").eq("school_id", school.id);
      if (links && links.length > 0) {
        const ids = links.map((l) => l.instructor_id);
        const { data: instData } = await supabase
          .from("instructors")
          .select("id, name, phone, lesson_rate, profile_image_url, postcode, transmission_type, bio, app_slug, average_rating, total_reviews")
          .in("id", ids)
          .eq("is_active", true);
        setInstructors(
          (instData || []).map((i) => ({ ...i, slug: i.app_slug }))
        );
      }
    };
    fetchData();
  }, [slug]);

  return (
    <SchoolWebsiteLayout pageType="home">
      {(school) => {
        const brandColor = school.brand_colour || "#3b82f6";
        const buttonColor = school.website_button_color || brandColor;
        const isMultiPage = school.website_tier === "multi_page";

        return (
          <div>
            {/* Hero */}
            <section
              className="relative py-20 md:py-28"
              style={{
                background: school.hero_image_url
                  ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${school.hero_image_url}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
              }}
            >
              <div className="container mx-auto px-4 text-center text-white relative z-10">
                {school.logo_url && (
                  <img src={school.logo_url} alt={school.name} className="h-16 w-auto mx-auto mb-6 object-contain" />
                )}
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  {page?.hero_heading || `Welcome to ${school.name}`}
                </h1>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
                  {page?.hero_subheading || school.description || "Professional driving instruction from qualified instructors"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {school.contact_phone && (
                    <a href={`tel:${school.contact_phone}`}>
                      <Button size="lg" style={{ backgroundColor: buttonColor }} className="text-white">
                        <Phone className="h-4 w-4 mr-2" /> Call Us Today
                      </Button>
                    </a>
                  )}
                  {isMultiPage && (
                    <Link to={`/school/${slug}/contact`}>
                      <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                        Get in Touch <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Content blocks */}
            {page?.content_blocks?.map((block, idx) => (
              <section key={idx} className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                  {block.type === "text" && (
                    <div className="max-w-3xl mx-auto text-center">
                      {block.title && <h2 className="text-2xl md:text-3xl font-bold mb-4">{block.title}</h2>}
                      {block.content && <p className="text-muted-foreground leading-relaxed">{block.content}</p>}
                    </div>
                  )}
                  {block.type === "features" && block.items && (
                    <div className="max-w-3xl mx-auto">
                      {block.title && <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">{block.title}</h2>}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {block.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: brandColor }} />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Instructor Cards */}
            {instructors.length > 0 && (
              <section className="py-12 md:py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Instructors</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {instructors.map((inst) => (
                      <Card key={inst.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {inst.profile_image_url ? (
                              <img src={inst.profile_image_url} alt={inst.name} className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: brandColor }}>
                                {inst.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{inst.name}</h3>
                              {inst.average_rating && (
                                <div className="flex items-center gap-1 text-sm text-amber-500">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  {inst.average_rating.toFixed(1)}
                                  {inst.total_reviews ? <span className="text-muted-foreground">({inst.total_reviews})</span> : null}
                                </div>
                              )}
                              {inst.postcode && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" /> {inst.postcode}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold" style={{ color: brandColor }}>£{inst.lesson_rate}</span>
                              <span className="text-xs text-muted-foreground">/hr</span>
                            </div>
                            {inst.transmission_type && (
                              <Badge variant="secondary" className="text-xs">{inst.transmission_type}</Badge>
                            )}
                          </div>
                          {inst.slug && (
                            <Link to={`/i/${inst.slug}`}>
                              <Button className="w-full mt-4 text-white" size="sm" style={{ backgroundColor: buttonColor }}>
                                View & Book
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {isMultiPage && (
                    <div className="text-center mt-8">
                      <Link to={`/school/${slug}/instructors`}>
                        <Button variant="outline">View All Instructors <ArrowRight className="h-4 w-4 ml-2" /></Button>
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CTA */}
            <section className="py-16" style={{ background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)` }}>
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Learning?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Get in touch today to book your first driving lesson with one of our qualified instructors.
                </p>
                {school.contact_phone && (
                  <a href={`tel:${school.contact_phone}`}>
                    <Button size="lg" style={{ backgroundColor: buttonColor }} className="text-white">
                      <Phone className="h-4 w-4 mr-2" /> {school.contact_phone}
                    </Button>
                  </a>
                )}
              </div>
            </section>
          </div>
        );
      }}
    </SchoolWebsiteLayout>
  );
}
