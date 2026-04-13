import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";

interface Props {
  instructorIds: string[];
}

interface LivePosition {
  id: string;
  pupil_id: string;
  instructor_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  trip_status: string | null;
  updated_at: string;
  pupil_name?: string;
  instructor_name?: string;
}

export default function SchoolLiveMapSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setPositions([
        { id: "1", pupil_id: "p1", instructor_id: "i1", latitude: 51.5074, longitude: -0.1278, speed_kmh: 28, trip_status: "driving", updated_at: new Date().toISOString(), pupil_name: "Emma Davis", instructor_name: "John Smith" },
        { id: "2", pupil_id: "p2", instructor_id: "i2", latitude: 51.5155, longitude: -0.1419, speed_kmh: 0, trip_status: "stopped", updated_at: new Date().toISOString(), pupil_name: "Jack Brown", instructor_name: "Sarah Jones" },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("live_pupil_positions")
        .select("*, pupils(name), instructors(name)")
        .in("instructor_id", instructorIds)
        .eq("is_active", true);
      setPositions(
        (data || []).map((p: any) => ({
          ...p,
          pupil_name: p.pupils?.name,
          instructor_name: p.instructors?.name,
        }))
      );
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Live Map</h2>
        <p className="text-muted-foreground">Real-time positions of active lessons</p>
      </div>
      {positions.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No active lessons right now</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.pupil_name || "Unknown"}</p>
                  <Badge variant={p.trip_status === "driving" ? "default" : "secondary"}>
                    {p.trip_status || "unknown"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Instructor: {p.instructor_name || "Unknown"}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</span>
                  {p.speed_kmh != null && <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{Math.round(p.speed_kmh)} km/h</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
