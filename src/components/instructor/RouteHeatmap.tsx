import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Flame } from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamic import for leaflet.heat
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    // @ts-ignore - leaflet.heat adds L.heatLayer
    const heat = (L as any).heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: { 0.2: "blue", 0.4: "cyan", 0.6: "lime", 0.8: "yellow", 1.0: "red" },
    });
    heat.addTo(map);

    // Fit bounds
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    if (lats.length > 0) {
      map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [30, 30] });
    }

    return () => { map.removeLayer(heat); };
  }, [map, points]);

  return null;
}

interface RouteHeatmapProps {
  instructorId: string;
}

export function RouteHeatmap({ instructorId }: RouteHeatmapProps) {
  const [range, setRange] = useState<"7" | "14" | "30">("7");
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>([52.5, -1.9]); // UK default

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    const days = parseInt(range);
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch GPS points from telematics sessions
    const { data: sessions } = await supabase
      .from("lesson_telematics")
      .select("id")
      .eq("instructor_id", instructorId)
      .gte("started_at", fromDate);

    if (!sessions || sessions.length === 0) {
      setPoints([]);
      setLoading(false);
      return;
    }

    const sessionIds = sessions.map(s => s.id);
    // Fetch in batches to avoid query limits
    const allPoints: [number, number, number][] = [];
    
    for (let i = 0; i < sessionIds.length; i += 10) {
      const batch = sessionIds.slice(i, i + 10);
      const { data: gpsPoints } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .in("telematics_id", batch)
        .limit(1000);

      if (gpsPoints) {
        for (const p of gpsPoints) {
          if (p.latitude && p.longitude) {
            allPoints.push([p.latitude, p.longitude, 0.5]);
          }
        }
      }
    }

    if (allPoints.length > 0) {
      setCenter([allPoints[0][0], allPoints[0][1]]);
    }

    setPoints(allPoints);
    setLoading(false);
  }, [instructorId, range]);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          Route Heatmap
        </h2>
        <Select value={range} onValueChange={(v) => setRange(v as "7" | "14" | "30")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <Skeleton className="h-[400px]" />
          ) : points.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No route data for this period</p>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
              <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatLayer points={points} />
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {points.length.toLocaleString()} GPS points from the last {range} days
      </p>
    </div>
  );
}
