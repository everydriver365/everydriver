import { useState, useEffect } from "react";
import dsmLogo from "@/assets/dsm-logo.png";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Star, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SchoolData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  contact_email: string | null;
  contact_phone: string | null;
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

export default function SchoolBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [instructors, setInstructors] = useState<InstructorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchSchool(slug);
  }, [slug]);

  const fetchSchool = async (schoolSlug: string) => {
    setLoading(true);

    const { data: schoolData, error } = await supabase
      .from("schools")
      .select("id, name, slug, description, logo_url, brand_colour, contact_email, contact_phone")
      .eq("slug", schoolSlug)
      .single() as any;

    if (error || !schoolData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setSchool(schoolData);

    // Get instructor IDs for this school
    const { data: members } = await supabase
      .from("school_instructors")
      .select("instructor_id")
      .eq("school_id", schoolData.id) as any;

    const instructorIds = (members || []).map((m: any) => m.instructor_id);

    if (instructorIds.length > 0) {
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("id, name, phone, lesson_rate, profile_image_url, postcode, transmission_type, bio, slug, average_rating, total_reviews")
        .in("id", instructorIds)
        .eq("is_active", true) as any;

      setInstructors(instructorData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">School Not Found</h1>
          <p className="text-muted-foreground">This driving school page doesn't exist or hasn't been set up yet.</p>
          <Button asChild variant="outline">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const brandColour = school.brand_colour || "hsl(var(--primary))";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative py-12 px-4 text-center"
        style={{ backgroundColor: brandColour }}
      >
        {school.logo_url && (
          <img
            src={school.logo_url}
            alt={`${school.name} logo`}
            className="h-16 w-auto mx-auto mb-4 rounded-lg"
          />
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white">{school.name}</h1>
        {school.description && (
          <p className="text-white/80 mt-2 max-w-xl mx-auto">{school.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-sm">
          {school.contact_phone && (
            <a href={`tel:${school.contact_phone}`} className="flex items-center gap-1 hover:text-white">
              <Phone className="h-3.5 w-3.5" /> {school.contact_phone}
            </a>
          )}
          {school.contact_email && (
            <a href={`mailto:${school.contact_email}`} className="flex items-center gap-1 hover:text-white">
              <Mail className="h-3.5 w-3.5" /> {school.contact_email}
            </a>
          )}
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-1">Our Instructors</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose an instructor to view their availability and book lessons
        </p>

        {instructors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No instructors are currently listed for this school.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3 p-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {instructor.profile_image_url ? (
                        <img
                          src={instructor.profile_image_url}
                          alt={instructor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {instructor.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{instructor.name}</h3>
                      {instructor.average_rating && instructor.average_rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{instructor.average_rating.toFixed(1)}</span>
                          {instructor.total_reviews && (
                            <span className="text-muted-foreground">({instructor.total_reviews})</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {instructor.postcode && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {instructor.postcode}
                          </span>
                        )}
                        {instructor.transmission_type && (
                          <Badge variant="outline" className="text-xs py-0">
                            {instructor.transmission_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {instructor.bio && (
                    <p className="text-xs text-muted-foreground px-4 pb-2 line-clamp-2">{instructor.bio}</p>
                  )}

                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      £{instructor.lesson_rate}/hr
                    </div>
                    <Button size="sm" asChild>
                      <Link to={`/book/${instructor.id}`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Powered by</span>
        <img src={dsmLogo} alt="DSM" className="h-5 w-auto" />
      </div>
    </div>
  );
}
