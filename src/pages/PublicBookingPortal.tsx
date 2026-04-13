import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import dsmLogo from "@/assets/dsm-logo.png";
import { Loader2, MapPin, Star, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BookingPageData {
  id: string;
  name: string;
  slug: string;
  page_type: string;
  instructor_id: string | null;
  school_id: string | null;
  heading: string | null;
  description: string | null;
  logo_url: string | null;
  brand_colour: string | null;
}

interface InstructorCard {
  id: string;
  name: string;
  phone: string | null;
  hourly_rate: number | null;
  profile_image_url: string | null;
  home_postcode: string | null;
  car_type: string | null;
  bio: string | null;
  app_slug: string | null;
}

export default function PublicBookingPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<BookingPageData | null>(null);
  const [instructors, setInstructors] = useState<InstructorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchPage(slug);
  }, [slug]);

  const fetchPage = async (pageSlug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setPage(data);

    if (data.page_type === "instructor" && data.instructor_id) {
      const { data: inst } = await supabase
        .from("instructors")
        .select("id, name, phone, hourly_rate, profile_image_url, home_postcode, car_type, bio, app_slug")
        .eq("id", data.instructor_id)
        .eq("is_active", true);
      if (inst) setInstructors(inst);
    } else if (data.page_type === "school" && data.school_id) {
      const { data: links } = await supabase
        .from("school_instructors")
        .select("instructor_id")
        .eq("school_id", data.school_id);
      if (links && links.length > 0) {
        const ids = links.map(l => l.instructor_id);
        const { data: inst } = await supabase
          .from("instructors")
          .select("id, name, phone, hourly_rate, profile_image_url, home_postcode, car_type, bio, app_slug")
          .in("id", ids)
          .eq("is_active", true)
          .order("name");
        if (inst) setInstructors(inst);
      }
    }
    setLoading(false);
  };

  const brandColour = page?.brand_colour || "#1a1a2e";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">This booking page doesn't exist or is no longer active.</p>
          <Button asChild><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="py-12 px-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${brandColour}, ${brandColour}dd)` }}>
        {page?.logo_url && (
          <img src={page.logo_url} alt="" className="h-12 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {page?.heading || "Book Your Driving Lessons"}
        </h1>
        {page?.description && (
          <p className="text-lg opacity-90 max-w-xl mx-auto">{page.description}</p>
        )}
      </div>

      {/* Instructors grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {instructors.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No instructors available at the moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map(inst => (
              <Card key={inst.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="h-2" style={{ backgroundColor: brandColour }} />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      {inst.profile_image_url ? (
                        <img src={inst.profile_image_url} alt={inst.name} className="h-14 w-14 rounded-full object-cover border-2" style={{ borderColor: brandColour }} />
                      ) : (
                        <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: brandColour }}>
                          {inst.name.charAt(0)}
                        </div>
                      )}
                       <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{inst.name}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {inst.home_postcode && (
                        <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{inst.home_postcode}</Badge>
                      )}
                      {inst.transmission_type && (
                        <Badge variant="outline" className="capitalize">{inst.transmission_type}</Badge>
                      )}
                    </div>

                    {inst.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{inst.bio}</p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {inst.hourly_rate && <span className="text-lg font-bold">£{inst.hourly_rate}/hr</span>}
                      <Button size="sm" asChild style={{ backgroundColor: brandColour }}>
                        <Link to={`/book/${inst.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img src={dsmLogo} alt="DSM" className="h-5 w-auto" />
        </div>
      </footer>
    </div>
  );
}
