import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, Car } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { formatDistanceToNowStrict } from "date-fns";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Props {
  instructorIds: string[];
}

interface LiveVehicle {
  id: string;
  type: "device" | "pupil";
  label: string;
  subLabel: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number | null;
  status: "driving" | "stopped" | "offline";
  lastSeenAt: string;
  roadName: string | null;
  sessionId: string | null;
}

export default function SchoolLiveMapSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // Load Google Maps
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key || cancelled) return;
        await loadGoogleMaps(key);
        if (!cancelled) setMapsReady(true);
      } catch (e) {
        console.error("Failed to load Google Maps:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapDivRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(mapDivRef.current, {
      center: { lat: 54.5, lng: -3.5 },
      zoom: 6,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeId: "roadmap",
    });
  }, [mapsReady]);

  const fetchVehicles = useCallback(async () => {
    if (isDemo) {
      setVehicles([
        { id: "1", type: "device", label: "Charlotte", subLabel: "John Smith", latitude: 51.5074, longitude: -0.1278, speedKmh: 28, heading: 90, status: "driving", lastSeenAt: new Date().toISOString(), roadName: "High Street", sessionId: null },
        { id: "2", type: "pupil", label: "Emma Davis", subLabel: "Sarah Jones", latitude: 51.5155, longitude: -0.1419, speedKmh: 0, heading: null, status: "stopped", lastSeenAt: new Date().toISOString(), roadName: "Oxford Road", sessionId: null },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }

    // Fetch GPS devices (hardware trackers) and live pupil positions in parallel
    const [devicesRes, pupilsRes, instructorsRes] = await Promise.all([
      supabase
        .from("gps_devices")
        .select("id, device_name, instructor_id, last_latitude, last_longitude, last_speed_kmh, last_heading, last_ignition_status, last_seen_at, last_road_name, current_session_id, is_active")
        .in("instructor_id", instructorIds)
        .not("last_latitude", "is", null),
      supabase
        .from("live_pupil_positions")
        .select("id, pupil_id, instructor_id, latitude, longitude, speed_kmh, heading, trip_status, updated_at, speed_limit_kmh")
        .in("instructor_id", instructorIds)
        .eq("is_active", true),
      supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds),
    ]);

    const instructorMap: Record<string, string> = {};
    (instructorsRes.data || []).forEach((i: any) => { instructorMap[i.id] = i.name; });

    // Fetch pupil names
    const pupilIds = [...new Set((pupilsRes.data || []).map((p: any) => p.pupil_id))];
    let pupilMap: Record<string, string> = {};
    if (pupilIds.length > 0) {
      const { data: pupils } = await supabase.from("pupils").select("id, name").in("id", pupilIds);
      if (pupils) pupilMap = Object.fromEntries(pupils.map(p => [p.id, p.name]));
    }

    const now = Date.now();
    const result: LiveVehicle[] = [];

    // Add hardware tracker devices
    (devicesRes.data || []).forEach((d: any) => {
      const age = d.last_seen_at ? now - new Date(d.last_seen_at).getTime() : Infinity;
      const isRecent = age < 300000; // 5 min
      if (!isRecent && !d.is_active) return; // skip truly stale devices

      result.push({
        id: `device-${d.id}`,
        type: "device",
        label: d.device_name || "Tracker",
        subLabel: instructorMap[d.instructor_id] || "Instructor",
        latitude: Number(d.last_latitude),
        longitude: Number(d.last_longitude),
        speedKmh: d.last_speed_kmh || 0,
        heading: d.last_heading,
        status: d.last_ignition_status && age < 60000 ? "driving" : age < 300000 ? "stopped" : "offline",
        lastSeenAt: d.last_seen_at || "",
        roadName: d.last_road_name,
        sessionId: d.current_session_id,
      });
    });

    // Add pupil live positions (avoid duplicates if already covered by device)
    (pupilsRes.data || []).forEach((p: any) => {
      result.push({
        id: `pupil-${p.id}`,
        type: "pupil",
        label: pupilMap[p.pupil_id] || "Pupil",
        subLabel: instructorMap[p.instructor_id] || "Instructor",
        latitude: p.latitude,
        longitude: p.longitude,
        speedKmh: p.speed_kmh || 0,
        heading: p.heading,
        status: p.trip_status === "driving" ? "driving" : "stopped",
        lastSeenAt: p.updated_at,
        roadName: null,
        sessionId: null,
      });
    });

    setVehicles(result);
    setLoading(false);
  }, [instructorIds, isDemo]);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  // Update map markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapsReady) return;

    const currentIds = new Set(vehicles.map(v => v.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    vehicles.forEach(v => {
      const pos = { lat: v.latitude, lng: v.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const color = v.status === "driving" ? "#16a34a" : v.status === "stopped" ? "#f59e0b" : "#9ca3af";
      const icon: google.maps.Symbol = {
        path: "M 0,-8 L -5,8 L 0,4 L 5,8 Z",
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
        scale: 2,
        rotation: v.heading ?? 0,
        anchor: new google.maps.Point(0, 0),
      };

      const existing = markersRef.current.get(v.id);
      if (existing) {
        existing.setPosition(pos);
        existing.setIcon(icon);
        existing.setTitle(v.label);
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          map,
          icon,
          title: v.label,
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;font-size:13px"><strong>${v.label}</strong><br/>${v.subLabel}<br/>${v.roadName || ""}<br/>${Math.round(v.speedKmh * 0.621371)} mph</div>`,
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
        
        markersRef.current.set(v.id, marker);
      }
    });

    if (hasPoints && vehicles.length > 0) {
      if (vehicles.length === 1) {
        map.setCenter({ lat: vehicles[0].latitude, lng: vehicles[0].longitude });
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 60);
      }
    }
  }, [vehicles, mapsReady]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Live Map</h2>
        <p className="text-muted-foreground">Real-time positions of vehicles and active lessons</p>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div ref={mapDivRef} className="h-[350px] w-full" />
      </Card>

      {/* Vehicle cards */}
      {vehicles.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No active vehicles or lessons right now</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {v.type === "device" ? (
                      <Car className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-medium">{v.label}</p>
                  </div>
                  <Badge
                    variant={v.status === "driving" ? "default" : "secondary"}
                    className={v.status === "driving" ? "bg-emerald-600" : ""}
                  >
                    {v.status === "driving" && (
                      <span className="relative flex h-1.5 w-1.5 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                    )}
                    {v.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{v.subLabel}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {v.roadName && (
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="h-3 w-3 shrink-0" />{v.roadName}
                    </span>
                  )}
                  {v.speedKmh > 0 && (
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />{kmhToMph(v.speedKmh)} mph
                    </span>
                  )}
                  {v.lastSeenAt && (
                    <span>{formatDistanceToNowStrict(new Date(v.lastSeenAt), { addSuffix: true })}</span>
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
