import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Button } from "@/components/ui/button";
import { Crosshair, ZoomIn, ZoomOut } from "lucide-react";

interface DrivingEvent {
  id: string;
  alert_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  created_at: string;
}

interface TraccarLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  speedLimitKmh: number | null;
  isConnected: boolean;
  sessionId: string | null;
  events?: DrivingEvent[];
  className?: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

export default function TraccarLiveMap({
  latitude,
  longitude,
  heading,
  speedKmh,
  speedLimitKmh,
  isConnected,
  sessionId,
  events = [],
  className = "",
}: TraccarLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const eventMarkersRef = useRef<L.Marker[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  // Map control functions
  const centerOnVehicle = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map && latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], map.getZoom(), { animate: true });
      setIsAutoCenter(true);
    }
  }, [latitude, longitude]);

  const handleZoomIn = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomOut();
    }
  }, []);
  // Fetch route points when session changes
  useEffect(() => {
    if (!sessionId) {
      setRoutePoints([]);
      return;
    }

    const fetchRoute = async () => {
      const { data } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(1000);

      if (data) {
        setRoutePoints(
          data
            .filter((p) => p.latitude && p.longitude)
            .map((p) => ({ lat: p.latitude!, lng: p.longitude! }))
        );
      }
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [54.5, -3.5],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(getMapTileUrl(), {
      attribution: getMapAttribution(),
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position and style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const speedMph = speedKmh !== null ? Math.round(speedKmh * 0.621371) : 0;
    const rotation = heading ?? 0;
    const markerColor = isConnected ? "#22c55e" : "#6b7280";

    const iconHtml = `
      <div style="position: relative; width: 60px; height: 60px; transform: translate(-30px, -30px);">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%) rotate(${rotation}deg);
        ">
          <svg viewBox="0 0 24 24" fill="${markerColor}" stroke="white" stroke-width="1.5">
            <path d="M12 2L4 20h16L12 2z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: ${markerColor};
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${speedMph} mph
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: "custom-vehicle-marker",
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    }

    // Only auto-pan if auto-center is enabled
    if (isAutoCenter) {
      map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
    }
  }, [latitude, longitude, heading, speedKmh, isConnected, isAutoCenter]);

  // Update route polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routePoints.length > 1) {
      polylineRef.current = L.polyline(
        routePoints.map((p): L.LatLngExpression => [p.lat, p.lng]),
        {
          color: "#22c55e",
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1,
        }
      ).addTo(map);
    }
  }, [routePoints]);

  // Update event markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];

    events.forEach((event) => {
      if (event.latitude === null || event.longitude === null) return;

      const isAcceleration = event.alert_type === "harsh_acceleration";
      const color = event.severity === "high" 
        ? "#ef4444" 
        : event.severity === "medium" 
        ? "#f97316" 
        : "#eab308";

      const iconHtml = `
        <div style="
          width: 28px;
          height: 28px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-14px, -14px);
        ">
          ${isAcceleration 
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
          }
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-event-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon })
        .bindPopup(`
          <div style="text-align: center; min-width: 120px;">
            <strong style="color: ${color}; text-transform: capitalize;">
              ${event.alert_type.replace(/_/g, " ")}
            </strong>
            <br/>
            <span style="font-size: 12px; color: #666;">
              ${event.severity} severity
              ${event.speed_kmh ? `<br/>${Math.round(event.speed_kmh * 0.621371)} mph` : ""}
            </span>
          </div>
        `)
        .addTo(map);

      eventMarkersRef.current.push(marker);
    });
  }, [events]);

  const speedMph = speedKmh !== null ? Math.round(speedKmh * 0.621371) : 0;
  
  // Convert speed limit from km/h to mph
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <div 
        ref={mapRef} 
        className="absolute inset-0" 
        onTouchStart={() => setIsAutoCenter(false)}
        onMouseDown={() => setIsAutoCenter(false)}
      />

      {/* Map Control Buttons */}
      <div className="absolute bottom-24 left-4 z-20 flex flex-col gap-2">
        <Button
          size="icon"
          variant={isAutoCenter ? "default" : "secondary"}
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={centerOnVehicle}
          title="Center on vehicle"
        >
          <Crosshair className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
      </div>

      {/* UK-style Speed Roundels */}
      {latitude !== null && longitude !== null && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 items-center">
          {/* Current Speed Display */}
          <div className="flex flex-col items-center">
            <div className={`w-18 h-18 min-w-[72px] min-h-[72px] rounded-full bg-background shadow-lg border-4 flex items-center justify-center ${speedLimitMph !== null && speedMph > speedLimitMph ? 'border-destructive' : 'border-green-500'}`}>
              <div className="flex flex-col items-center">
                <span className={`text-3xl font-bold leading-none ${speedLimitMph !== null && speedMph > speedLimitMph ? 'text-destructive' : 'text-foreground'}`}>
                  {speedMph}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">MPH</span>
              </div>
            </div>
          </div>

          {/* UK Speed Limit Roundel (red ring) */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-background shadow-lg border-[5px] border-destructive flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {speedLimitMph !== null ? speedLimitMph : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {(latitude === null || longitude === null) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Waiting for GPS signal...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Make sure Traccar Client is running
          </p>
        </div>
      )}

      <style>{`
        .custom-vehicle-marker,
        .custom-event-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
