import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";

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

    map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
  }, [latitude, longitude, heading, speedKmh, isConnected]);

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
          color: "#3b82f6",
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
  
  // TODO: Speed limit would come from a speed limit API - for now show placeholder
  // In a real implementation, you'd fetch this based on current lat/lon
  const speedLimitMph = 30; // Placeholder - would come from road data API

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* UK-style Speed Roundel with limit ring */}
      {latitude !== null && longitude !== null && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex flex-col items-center">
            {/* Combined speed display with UK limit ring */}
            <div className="relative">
              {/* Outer red ring (speed limit indicator) */}
              <div className="w-20 h-20 rounded-full bg-white shadow-lg border-[6px] border-red-600 flex items-center justify-center">
                {/* Inner speed display */}
                <div className="flex flex-col items-center">
                  <span className={`text-3xl font-bold leading-none ${speedMph > speedLimitMph ? 'text-red-600' : 'text-foreground'}`}>
                    {speedMph}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">MPH</span>
                </div>
              </div>
              {/* Speed limit badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                {speedLimitMph}
              </div>
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
