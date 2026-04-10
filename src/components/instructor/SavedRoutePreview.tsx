import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navigation, Expand } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface SavedRoutePreviewProps {
  telematicsId: string;
  onNavigateToStart?: (lat: number, lng: number, name: string) => void;
}

export function SavedRoutePreview({ telematicsId, onNavigateToStart }: SavedRoutePreviewProps) {
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchGpsPoints();
  }, [telematicsId]);

  useEffect(() => {
    if (!mapContainerRef.current || gpsPoints.length < 2) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    });
    mapRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    // Create route polyline
    const routeCoords = gpsPoints.map(p => [p.latitude, p.longitude] as [number, number]);
    const polyline = L.polyline(routeCoords, {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.8
    }).addTo(map);

    // Add start marker
    const startIcon = L.divIcon({
      className: "custom-marker",
      html: '<div style="width: 12px; height: 12px; background: #22c55e; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    L.marker([gpsPoints[0].latitude, gpsPoints[0].longitude], { icon: startIcon }).addTo(map);

    // Add end marker
    const endIcon = L.divIcon({
      className: "custom-marker",
      html: '<div style="width: 12px; height: 12px; background: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    L.marker([gpsPoints[gpsPoints.length - 1].latitude, gpsPoints[gpsPoints.length - 1].longitude], { icon: endIcon }).addTo(map);

    // Fit bounds
    map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [gpsPoints]);

  const fetchGpsPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude, speed_kmh, recorded_at")
        .eq("telematics_id", telematicsId)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      setGpsPoints(data || []);
    } catch (error) {
      console.error("Error fetching GPS points:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToStart = () => {
    if (gpsPoints.length > 0 && onNavigateToStart) {
      onNavigateToStart(gpsPoints[0].latitude, gpsPoints[0].longitude, "Route Start");
    }
  };

  if (loading) {
    return <div className="h-32 bg-muted animate-pulse rounded-none" />;
  }

  if (gpsPoints.length < 2) {
    return (
      <div className="h-32 bg-muted/50 rounded-none flex items-center justify-center text-sm text-muted-foreground">
        No GPS data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={mapContainerRef} className="h-32 rounded-none overflow-hidden" />
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleNavigateToStart}
      >
        <Navigation className="h-4 w-4" />
        Navigate to Start
      </Button>
    </div>
  );
}
