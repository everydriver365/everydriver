import { useState, useEffect } from "react";
import { MapPin, Loader2, Car, Clock, Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolFleetSessions } from "@/data/demoSchoolData";
import { formatDistanceToNowStrict } from "date-fns";

interface Props { instructorIds: string[]; }

interface FleetItem {
  id: string;
  type: "session" | "device";
  label: string;
  instructorName: string;
  startedAt: string | null;
  distanceKm: number;
  speedKmh: number;
  roadName: string | null;
  isLive: boolean;
  lastSeenAt: string | null;
}

const kmToMiles = (km: number) => +(km * 0.621371).toFixed(1);
const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

export default function SchoolFleetSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [items, setItems] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setItems(demoSchoolFleetSessions.map((s: any) => ({
        id: s.id,
        type: "session" as const,
        label: s.pupils?.name || "Student",
        instructorName: s.instructors?.name || "Instructor",
        startedAt: s.started_at,
        distanceKm: s.total_distance_km || 0,
        speedKmh: 0,
        roadName: null,
        isLive: true,
        lastSeenAt: null,
      })));
      setLoading(false);
      return;
    }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchFleet();
  }, [instructorIds, isDemo]);

  const fetchFleet = async () => {
    setLoading(true);

    const [sessionsRes, devicesRes, instructorsRes] = await Promise.all([
      supabase
        .from("lesson_telematics")
        .select("id, started_at, total_distance_km, pupil_id, instructor_id")
        .in("instructor_id", instructorIds)
        .is("ended_at", null)
        .order("started_at", { ascending: false }),
      supabase
        .from("gps_devices")
        .select("id, device_name, instructor_id, last_speed_kmh, last_road_name, last_seen_at, current_session_id, is_active")
        .in("instructor_id", instructorIds),
      supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds),
    ]);

    const instructorMap: Record<string, string> = {};
    (instructorsRes.data || []).forEach((i: any) => { instructorMap[i.id] = i.name; });

    // Fetch pupil names for active sessions
    const pupilIds = [...new Set((sessionsRes.data || []).map((s: any) => s.pupil_id).filter(Boolean))];
    let pupilMap: Record<string, string> = {};
    if (pupilIds.length > 0) {
      const { data: pupils } = await supabase.from("pupils").select("id, name").in("id", pupilIds);
      if (pupils) pupilMap = Object.fromEntries(pupils.map(p => [p.id, p.name]));
    }

    const result: FleetItem[] = [];
    const sessionDeviceIds = new Set<string>();

    // Active sessions
    (sessionsRes.data || []).forEach((s: any) => {
      result.push({
        id: s.id,
        type: "session",
        label: s.pupil_id ? (pupilMap[s.pupil_id] || "Pupil") : "Solo Drive",
        instructorName: instructorMap[s.instructor_id] || "Instructor",
        startedAt: s.started_at,
        distanceKm: s.total_distance_km || 0,
        speedKmh: 0,
        roadName: null,
        isLive: true,
        lastSeenAt: null,
      });
    });

    // Devices not in an active session but recently seen
    const activeSessionIds = new Set((sessionsRes.data || []).map((s: any) => s.id));
    (devicesRes.data || []).forEach((d: any) => {
      // Skip if device has an active session already shown
      if (d.current_session_id && activeSessionIds.has(d.current_session_id)) return;

      const age = d.last_seen_at ? Date.now() - new Date(d.last_seen_at).getTime() : Infinity;
      if (age > 86400000) return; // skip if last seen > 24h ago

      result.push({
        id: `dev-${d.id}`,
        type: "device",
        label: d.device_name || "Tracker",
        instructorName: instructorMap[d.instructor_id] || "Instructor",
        startedAt: null,
        distanceKm: 0,
        speedKmh: d.last_speed_kmh || 0,
        roadName: d.last_road_name,
        isLive: d.is_active && age < 60000,
        lastSeenAt: d.last_seen_at,
      });
    });

    // Enrich sessions with device speed/road data
    const deviceBySession = new Map<string, any>();
    (devicesRes.data || []).forEach((d: any) => {
      if (d.current_session_id) deviceBySession.set(d.current_session_id, d);
    });
    result.forEach(item => {
      if (item.type === "session") {
        const dev = deviceBySession.get(item.id);
        if (dev) {
          item.speedKmh = dev.last_speed_kmh || 0;
          item.roadName = dev.last_road_name;
          item.lastSeenAt = dev.last_seen_at;
        }
      }
    });

    setItems(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isDemo || !instructorIds.length) return;
    const interval = setInterval(fetchFleet, 10000);
    return () => clearInterval(interval);
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Fleet Tracking</h2>
        <p className="text-muted-foreground">Live GPS sessions and tracked vehicles across your school</p>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No active tracking sessions or devices</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    item.isLive ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-muted"
                  }`}>
                    {item.type === "device" ? (
                      <Car className={`h-5 w-5 ${item.isLive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                    ) : (
                      <MapPin className={`h-5 w-5 ${item.isLive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.instructorName}</p>
                  </div>
                  {item.isLive ? (
                    <Badge className="bg-emerald-600 text-white text-xs gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {item.lastSeenAt
                        ? formatDistanceToNowStrict(new Date(item.lastSeenAt), { addSuffix: true })
                        : "Offline"}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {item.roadName && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="h-3 w-3 shrink-0" />{item.roadName}
                    </span>
                  )}
                  {item.speedKmh > 0 && (
                    <span>{kmhToMph(item.speedKmh)} mph</span>
                  )}
                  {item.startedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Started {new Date(item.startedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {item.distanceKm > 0 && (
                    <span className="flex items-center gap-1">
                      <Route className="h-3 w-3" />{kmToMiles(item.distanceKm)} mi
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
