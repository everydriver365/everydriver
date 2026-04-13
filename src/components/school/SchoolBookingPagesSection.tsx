import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Globe } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";

interface Props {
  instructorIds: string[];
  schoolId: string;
}

interface BookingPage {
  id: string;
  name: string;
  slug: string;
  page_type: string;
  is_active: boolean;
  brand_colour: string | null;
}

export default function SchoolBookingPagesSection({ instructorIds, schoolId }: Props) {
  const { isDemo } = useSchoolDemo();
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setPages([
        { id: "1", name: "Main School Page", slug: "demo-school", page_type: "school", is_active: true, brand_colour: "#2563eb" },
        { id: "2", name: "John Smith – Lessons", slug: "john-smith", page_type: "instructor", is_active: true, brand_colour: null },
      ]);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("booking_pages")
        .select("*")
        .or(`school_id.eq.${schoolId},instructor_id.in.(${instructorIds.join(",")})`)
        .order("created_at", { ascending: false });
      setPages((data as BookingPage[]) || []);
      setLoading(false);
    };
    fetch();
  }, [instructorIds, schoolId, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Booking Pages</h2>
        <p className="text-muted-foreground">Public booking pages for your school and instructors</p>
      </div>
      {pages.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No booking pages found</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Live" : "Draft"}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{p.page_type} page</span>
                  <a href={`/booking/${p.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    /booking/{p.slug} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
