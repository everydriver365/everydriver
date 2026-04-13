import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Mail, MapPin } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { format } from "date-fns";

interface Props {
  instructorIds: string[];
}

interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string;
  course_type: string;
  preferred_timing: string;
  status: string;
  created_at: string;
  additional_notes: string | null;
  requested_hours: number | null;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  booked: "bg-green-100 text-green-800",
  lost: "bg-muted text-muted-foreground",
};

export default function SchoolEnquiriesSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setEnquiries([
        { id: "1", name: "Sarah Johnson", email: "sarah@example.com", phone: "07700 900123", postcode: "SW1A 1AA", course_type: "intensive", preferred_timing: "Weekday mornings", status: "new", created_at: new Date().toISOString(), additional_notes: "Wants to pass before summer", requested_hours: 30 },
        { id: "2", name: "Tom Williams", email: "tom@example.com", phone: "07700 900456", postcode: "EC1A 1BB", course_type: "weekly", preferred_timing: "Weekend afternoons", status: "contacted", created_at: new Date(Date.now() - 86400000).toISOString(), additional_notes: null, requested_hours: 20 },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("course_enquiries")
        .select("*")
        .in("assigned_instructor_id", instructorIds)
        .order("created_at", { ascending: false });
      setEnquiries((data as Enquiry[]) || []);
      setLoading(false);
    };
    fetch();
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Enquiries & Callbacks</h2>
        <p className="text-muted-foreground">Course enquiries assigned to your school's instructors</p>
      </div>
      {enquiries.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No enquiries found</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enquiries.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{e.name}</CardTitle>
                  <Badge className={statusColors[e.status] || ""}>{e.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium capitalize">{e.course_type} — {e.requested_hours || "?"} hours</p>
                <p className="text-muted-foreground">{e.preferred_timing}</p>
                {e.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</p>}
                {e.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{e.phone}</p>}
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.postcode}</p>
                {e.additional_notes && <p className="text-muted-foreground italic">"{e.additional_notes}"</p>}
                <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "dd MMM yyyy HH:mm")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
