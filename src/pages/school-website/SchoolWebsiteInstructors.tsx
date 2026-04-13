import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SchoolWebsiteLayout from "./SchoolWebsiteLayout";

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

export default function SchoolWebsiteInstructors() {
  const { slug } = useParams<{ slug: string }>();
  const [instructors, setInstructors] = useState<InstructorCard[]>([]);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data: school } = await supabase.from("schools").select("id").eq("slug", slug).maybeSingle();
      if (!school) return;
      const { data: links } = await supabase.from("school_instructors").select("instructor_id").eq("school_id", school.id);
      if (links && links.length > 0) {
        const ids = links.map((l) => l.instructor_id);
        const { data } = await supabase
          .from("instructors")
          .select("id, name, phone, lesson_rate, profile_image_url, postcode, transmission_type, bio, app_slug, average_rating, total_reviews")
          .in("id", ids)
          .eq("is_active", true) as any;
        setInstructors((data || []).map((i: any) => ({ ...i, slug: i.app_slug })));
      }
    };
    fetch();
  }, [slug]);

  return (
    <SchoolWebsiteLayout pageType="instructors">
      {(school) => {
        const brandColor = school.brand_colour || "#3b82f6";
        const buttonColor = school.website_button_color || brandColor;
        return (
          <div>
            <section className="py-16 md:py-20" style={{ background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)` }}>
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Instructors</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Meet our team of qualified driving instructors</p>
              </div>
            </section>

            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {instructors.map((inst) => (
                    <Card key={inst.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          {inst.profile_image_url ? (
                            <img src={inst.profile_image_url} alt={inst.name} className="w-24 h-24 rounded-full object-cover mb-4" />
                          ) : (
                            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4" style={{ backgroundColor: brandColor }}>
                              {inst.name.charAt(0)}
                            </div>
                          )}
                          <h3 className="font-semibold text-lg">{inst.name}</h3>
                          {inst.average_rating && (
                            <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                              <Star className="h-4 w-4 fill-current" />
                              {inst.average_rating.toFixed(1)}
                              {inst.total_reviews ? <span className="text-muted-foreground">({inst.total_reviews} reviews)</span> : null}
                            </div>
                          )}
                          {inst.postcode && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3.5 w-3.5" /> {inst.postcode}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xl font-bold" style={{ color: brandColor }}>£{inst.lesson_rate}</span>
                            <span className="text-sm text-muted-foreground">per hour</span>
                            {inst.transmission_type && <Badge variant="secondary" className="text-xs">{inst.transmission_type}</Badge>}
                          </div>
                          {inst.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{inst.bio}</p>}
                          <div className="flex gap-2 mt-4 w-full">
                            {inst.slug && (
                              <Link to={`/i/${inst.slug}`} className="flex-1">
                                <Button className="w-full text-white" size="sm" style={{ backgroundColor: buttonColor }}>View & Book</Button>
                              </Link>
                            )}
                            <a href={`tel:${inst.phone}`} className="flex-shrink-0">
                              <Button variant="outline" size="sm"><Phone className="h-4 w-4" /></Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {instructors.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">No instructors currently listed.</p>
                )}
              </div>
            </section>
          </div>
        );
      }}
    </SchoolWebsiteLayout>
  );
}
