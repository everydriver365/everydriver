import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Route, Calendar, Clock, TrendingUp, MapPin } from "lucide-react";
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
  distance_km: number | null;
  duration_minutes: number | null;
  started_at: string | null;
  ended_at: string | null;
  coordinates: Coordinate[];
  created_at: string;
}

interface PupilRouteHistoryProps {
  pupilId: string;
  brandColour?: string | null;
}

export function PupilRouteHistory({ pupilId, brandColour }: PupilRouteHistoryProps) {
  const [routes, setRoutes] = useState<LessonRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<LessonRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data, error } = await (supabase.from("lesson_routes" as any) as any)
        .select("*")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setRoutes(
          data.map((r: any) => ({
            ...r,
            coordinates: Array.isArray(r.coordinates) ? r.coordinates : [],
          }))
        );
      }
      setLoading(false);
    };
    fetchRoutes();
  }, [pupilId]);

  const routePath = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.coordinates.map((c) => [c.lat, c.lng] as [number, number]);
  }, [selectedRoute]);

  // Speed-colored segments
  const speedSegments = useMemo(() => {
    if (!selectedRoute) return [];
    const segments: { path: [number, number][]; color: string }[] = [];
    let current: { path: [number, number][]; color: string } | null = null;

    for (const coord of selectedRoute.coordinates) {
      const speed = coord.speed_kmh || 0;
      const limit = coord.speed_limit_kmh;
      let color: string;
      if (!limit) {
        color = brandColour || "hsl(var(--primary))";
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
  }, [selectedRoute, brandColour]);

  const center: [number, number] = useMemo(() => {
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
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Loading routes...
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Route className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No lesson routes yet</p>
          <p className="text-xs mt-1">Routes will appear here after your lessons</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Route className="h-4 w-4" style={{ color: brandColour || undefined }} />
          My Lesson Routes
        </h3>
        <Badge variant="secondary" className="text-xs">
          {routes.length} route{routes.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Progression summary */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{routes.length}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {routes.reduce((sum, r) => sum + ((r.distance_km || 0) * 0.621371), 0).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Miles</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {Math.round(routes.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) / 60)}
              </p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {routes.map((route, idx) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
              selectedRoute?.id === route.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: brandColour || "hsl(var(--primary))" }}
                >
                  {routes.length - idx}
                </div>
                <div>
                  <span className="font-medium">
                    {route.started_at
                      ? format(new Date(route.started_at), "EEE, d MMM yyyy")
                      : format(new Date(route.created_at), "EEE, d MMM yyyy")}
                  </span>
                  {route.started_at && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(route.started_at), "HH:mm")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {route.distance_km && (
                  <Badge variant="secondary" className="text-xs">
                    {(route.distance_km * 0.621371).toFixed(1)} mi
                  </Badge>
                )}
                {route.duration_minutes && (
                  <Badge variant="outline" className="text-xs gap-0.5">
                    <Clock className="h-3 w-3" />
                    {route.duration_minutes}m
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Map */}
      {selectedRoute && routePath.length > 0 && (
        <div className="h-64 rounded-lg overflow-hidden border">
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
              <Polyline
                positions={routePath}
                color={brandColour || "hsl(var(--primary))"}
                weight={4}
                opacity={0.8}
              />
            )}
            <CircleMarker
              center={routePath[0]}
              radius={7}
              fillColor="hsl(142 76% 36%)"
              fillOpacity={1}
              color="white"
              weight={2}
            />
            <CircleMarker
              center={routePath[routePath.length - 1]}
              radius={7}
              fillColor="hsl(var(--destructive))"
              fillOpacity={1}
              color="white"
              weight={2}
            />
          </MapContainer>

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
