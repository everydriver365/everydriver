import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertTriangle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type SeverityFilter = "all" | "low" | "medium" | "high";

interface SpeedingPoint {
  lat: number;
  lng: number;
  severity: string;
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  road_name: string | null;
}

export function SpeedHeatmapTab() {
  const { instructor } = useInstructorAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  // Load Google Maps SDK
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key || cancelled) return;
        await loadGoogleMaps(key);
        if (!cancelled) setMapsReady(true);
      } catch (e) {
        console.error("[SpeedHeatmap] Failed to load maps:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch all speeding alerts with coordinates
  const { data: speedingPoints = [], isLoading } = useQuery({
    queryKey: ["speed-heatmap", instructor?.id],
    enabled: !!instructor?.id,
    queryFn: async () => {
      // Get all telematics sessions for this instructor
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", instructor!.id);

      if (!sessions?.length) return [];

      const sessionIds = sessions.map(s => s.id);

      // Batch fetch speeding alerts (handle >1000 sessions)
      const allAlerts: SpeedingPoint[] = [];
      const batchSize = 200;

      for (let i = 0; i < sessionIds.length; i += batchSize) {
        const batch = sessionIds.slice(i, i + batchSize);
        const { data: alerts } = await supabase
          .from("telematics_alerts")
          .select("latitude, longitude, severity, speed_kmh, speed_limit_kmh, road_name")
          .eq("alert_type", "speeding")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .in("telematics_id", batch);

        if (alerts) {
          allAlerts.push(
            ...alerts
              .filter(a => a.latitude != null && a.longitude != null)
              .map(a => ({
                lat: a.latitude!,
                lng: a.longitude!,
                severity: a.severity || "low",
                speed_kmh: a.speed_kmh,
                speed_limit_kmh: a.speed_limit_kmh,
                road_name: a.road_name,
              }))
          );
        }
      }

      return allAlerts;
    },
  });

  const filteredPoints = severityFilter === "all"
    ? speedingPoints
    : speedingPoints.filter(p => p.severity === severityFilter);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapRef.current || !mapsReady || mapInstanceRef.current) return;

    // Default to UK center
    const center = filteredPoints.length > 0
      ? { lat: filteredPoints[0].lat, lng: filteredPoints[0].lng }
      : { lat: 52.5, lng: -1.5 };

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 11,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [mapsReady, filteredPoints]);

  useEffect(() => { initMap(); }, [initMap]);

  // Update heatmap layer when data or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsReady) return;

    // Remove existing heatmap
    heatmapRef.current?.setMap(null);

    if (filteredPoints.length === 0) return;

    const heatmapData = filteredPoints.map(p => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.severity === "high" ? 5 : p.severity === "medium" ? 3 : 1,
    }));

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 30,
      opacity: 0.7,
      gradient: [
        "rgba(0, 0, 0, 0)",
        "rgba(255, 200, 0, 0.4)",
        "rgba(255, 160, 0, 0.6)",
        "rgba(255, 100, 0, 0.7)",
        "rgba(255, 50, 0, 0.8)",
        "rgba(220, 0, 0, 0.9)",
        "rgba(180, 0, 0, 1)",
      ],
    });

    // Auto-fit bounds
    if (filteredPoints.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      filteredPoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstanceRef.current.fitBounds(bounds, 40);
    }
  }, [filteredPoints, mapsReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      heatmapRef.current?.setMap(null);
      mapInstanceRef.current = null;
    };
  }, []);

  const severityCounts = {
    all: speedingPoints.length,
    low: speedingPoints.filter(p => p.severity === "low").length,
    medium: speedingPoints.filter(p => p.severity === "medium").length,
    high: speedingPoints.filter(p => p.severity === "high").length,
  };

  if (isLoading || !mapsReady) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full rounded-none" />
        <Skeleton className="h-[340px] w-full rounded-none" />
      </div>
    );
  }

  if (speedingPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Flame className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No speeding data yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Speeding events will appear here as trips are recorded
        </p>
      </div>
    );
  }

  // Top speeding roads
  const roadCounts = speedingPoints.reduce<Record<string, number>>((acc, p) => {
    if (p.road_name) acc[p.road_name] = (acc[p.road_name] || 0) + 1;
    return acc;
  }, {});
  const topRoads = Object.entries(roadCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Severity filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["all", "low", "medium", "high"] as SeverityFilter[]).map(sev => (
          <Button
            key={sev}
            variant={severityFilter === sev ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs whitespace-nowrap shrink-0 gap-1.5",
              severityFilter === sev && sev === "high" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              severityFilter === sev && sev === "medium" && "bg-orange-500 text-white hover:bg-orange-600",
            )}
            onClick={() => {
              setSeverityFilter(sev);
              // Reset map instance to rebuild heatmap
              if (mapInstanceRef.current && filteredPoints.length > 0) {
                heatmapRef.current?.setMap(null);
              }
            }}
          >
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-background/20">
              {severityCounts[sev]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[340px] rounded-none overflow-hidden border border-border/40 shadow-sm"
      />

      {/* Top speeding roads */}
      {topRoads.length > 0 && (
        <div className="rounded-none border border-border/40 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold">Most Frequent Speeding Locations</h3>
          </div>
          <div className="space-y-2">
            {topRoads.map(([road, count]) => (
              <div key={road} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{road}</span>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {count} {count === 1 ? "event" : "events"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
