import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Route, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

interface Coordinate {
  lat: number;
  lng: number;
  speed_kmh?: number;
  speed_limit_kmh?: number;
  road_name?: string;
  timestamp?: string;
}

interface LessonRoute {
  id: string;
  pupil_id: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  started_at: string | null;
  ended_at: string | null;
  coordinates: Coordinate[];
  created_at: string;
}

interface LessonRouteViewerProps {
  pupilId: string;
  pupilName?: string;
}

export function LessonRouteViewer({ pupilId, pupilName }: LessonRouteViewerProps) {
  const [routes, setRoutes] = useState<LessonRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<LessonRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase.from("lesson_routes" as any) as any)
          .select("*")
          .eq("pupil_id", pupilId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          setRoutes(data.map((r: any) => ({
            ...r,
            coordinates: Array.isArray(r.coordinates) ? r.coordinates : [],
          })));
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [pupilId]);

  const routePath = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.coordinates.map((c) => [c.lat, c.lng] as [number, number]);
  }, [selectedRoute]);

  // Speed-colored segments (reuses TripReplayMap pattern)
  const speedSegments = useMemo(() => {
    if (!selectedRoute) return [];
    const segments: { path: [number, number][]; color: string }[] = [];
    let current: { path: [number, number][]; color: string } | null = null;

    for (const coord of selectedRoute.coordinates) {
      const speed = coord.speed_kmh || 0;
      const limit = coord.speed_limit_kmh;

      let color: string;
      if (!limit) {
        color = "hsl(var(--primary))";
      } else if (speed > limit + 10) {
        color = "hsl(var(--destructive))";
      } else if (speed > limit) {
        color = "hsl(35 100% 50%)";
      } else {
        color = "hsl(142 76% 36%)";
      }

      const pos: [number, number] = [coord.lat, coord.lng];
      if (!current || current.color !== color) {
        if (current && current.path.length > 0) {
          current.path.push(pos);
          segments.push(current);
        }
        current = { path: [pos], color };
      } else {
        current.path.push(pos);
      }
    }
    if (current && current.path.length > 1) segments.push(current);
    return segments;
  }, [selectedRoute]);

  const center = useMemo((): [number, number] => {
    if (routePath.length === 0) return [51.5074, -0.1278];
    const lats = routePath.map((p) => p[0]);
    const lngs = routePath.map((p) => p[1]);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }, [routePath]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          Loading routes...
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Route className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No lesson routes recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <Route className="h-4 w-4 text-primary" />
        Lesson Routes
      </h3>

      {/* Route list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
            className={`w-full text-left p-3 rounded-none border text-sm transition-colors ${
              selectedRoute?.id === route.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {route.started_at
                    ? format(new Date(route.started_at), "EEE, d MMM yyyy")
                    : format(new Date(route.created_at), "EEE, d MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {route.distance_km && (
                  <Badge variant="secondary" className="text-xs">
                    {(route.distance_km * 0.621371).toFixed(1)} mi
                  </Badge>
                )}
                {route.duration_minutes && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {route.duration_minutes} min
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Map with speed-colored segments */}
      {selectedRoute && routePath.length > 0 && (
        <div className="rounded-none overflow-hidden border">
          <div className="h-64">
            <MapContainer
              center={center}
              zoom={13}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />

              {speedSegments.length > 0 ? (
                speedSegments.map((seg, i) => (
                  <Polyline key={i} positions={seg.path} color={seg.color} weight={5} opacity={0.85} />
                ))
              ) : (
                <Polyline positions={routePath} color="hsl(var(--primary))" weight={4} opacity={0.8} />
              )}

              {/* Start marker */}
              <CircleMarker
                center={routePath[0]}
                radius={7}
                fillColor="hsl(142 76% 36%)"
                fillOpacity={1}
                color="white"
                weight={2}
              />
              {/* End marker */}
              <CircleMarker
                center={routePath[routePath.length - 1]}
                radius={7}
                fillColor="hsl(var(--destructive))"
                fillOpacity={1}
                color="white"
                weight={2}
              />
            </MapContainer>
          </div>

          {/* Speed legend */}
          <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-2 w-4 rounded-full bg-[hsl(142,76%,36%)]" /> Within limit
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-4 rounded-full bg-[hsl(35,100%,50%)]" /> Slightly over
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-4 rounded-full bg-destructive" /> Speeding
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
