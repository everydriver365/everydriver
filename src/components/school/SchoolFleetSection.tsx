import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolFleetSessions } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

export default function SchoolFleetSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setSessions(demoSchoolFleetSessions); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchSessions();
  }, [instructorIds, isDemo]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase.from("lesson_telematics").select("*, pupils(name), instructors(name)").in("instructor_id", instructorIds).is("ended_at", null).order("started_at", { ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Fleet Tracking</h2>
        <p className="text-muted-foreground">Live GPS sessions across your school</p>
      </div>
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No active tracking sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sessions.map(s => (
            <Card key={s.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.pupils?.name || "Student"}</p>
                    <p className="text-xs text-muted-foreground">{s.instructors?.name || "Instructor"}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">Live</Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Started: {new Date(s.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  {s.total_distance_km && <span>{s.total_distance_km.toFixed(1)} km</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
