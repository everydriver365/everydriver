import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Navigation, Locate } from "lucide-react";

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
  roadName?: string | null;
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
  roadName,
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

  // Fetch route points when session changes + realtime subscription
  // IMPORTANT: Only fetch/display route when there's an active session
  useEffect(() => {
    // Clear route and polyline when no session
    if (!sessionId) {
      setRoutePoints([]);
      // Also clear the polyline on the map
      if (polylineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      return;
    }

    const fetchRoute = async () => {
      const { data } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(2000);

      if (data) {
        setRoutePoints(
          data
            .filter((p) => p.latitude && p.longitude)
            .map((p) => ({ lat: p.latitude!, lng: p.longitude! }))
        );
      } else {
        // No data for this session - ensure route is clear
        setRoutePoints([]);
      }
    };

    fetchRoute();
    
    // Subscribe to realtime GPS point inserts for instant route updates
    const channel = supabase
      .channel(`route-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telematics_gps_points",
          filter: `telematics_id=eq.${sessionId}`,
        },
        (payload) => {
          const newPoint = payload.new as { latitude: number; longitude: number };
          if (newPoint.latitude && newPoint.longitude) {
            setRoutePoints((prev) => [
              ...prev,
              { lat: newPoint.latitude, lng: newPoint.longitude },
            ]);
          }
        }
      )
      .subscribe();

    // Fallback polling every 5s in case realtime misses anything
    const interval = setInterval(fetchRoute, 5000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [sessionId]);

  // Initialize map with light theme - center on actual location if available
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Use real coordinates if available, otherwise default to UK center
    const initialLat = latitude ?? 54.5;
    const initialLng = longitude ?? -3.5;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(getMapTileUrl(), {
      attribution: getMapAttribution(),
      maxZoom: 19,
    }).addTo(map);

    // Small attribution in corner
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapInstanceRef.current = map;

    // Ensure Leaflet recalculates layout after initial paint / layout shifts
    const invalidate = () => map.invalidateSize();
    const timeout = window.setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", invalidate);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Disable auto-centering only when the user actually moves the map (drag/zoom)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const disable = () => setIsAutoCenter(false);
    map.on("dragstart", disable);
    map.on("zoomstart", disable);

    return () => {
      map.off("dragstart", disable);
      map.off("zoomstart", disable);
    };
  }, []);

  // Update marker position and style (Apple Maps navigation arrow style)
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

    const rotation = heading ?? 0;

    // Apple Maps style navigation arrow with pulse ring
    const iconHtml = `
      <div style="position: relative; width: 56px; height: 56px; transform: translate(-28px, -28px);">
        <!-- Pulse ring -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 56px;
          height: 56px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <!-- White circle background -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
        <!-- Navigation arrow -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 24px;
          height: 24px;
          transform: translate(-50%, -50%) rotate(${rotation}deg);
        ">
          <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="none">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: "custom-vehicle-marker",
      iconSize: [56, 56],
      iconAnchor: [28, 28],
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
  }, [latitude, longitude, heading, isAutoCenter]);

  // Update route polyline with bright blue color
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routePoints.length > 1) {
      // Add a glow effect underneath
      L.polyline(
        routePoints.map((p): L.LatLngExpression => [p.lat, p.lng]),
        {
          color: "#3b82f6",
          weight: 10,
          opacity: 0.3,
          smoothFactor: 1,
        }
      ).addTo(map);

      polylineRef.current = L.polyline(
        routePoints.map((p): L.LatLngExpression => [p.lat, p.lng]),
        {
          color: "#3b82f6",
          weight: 5,
          opacity: 1,
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
          width: 24px;
          height: 24px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-12px, -12px);
        ">
          ${isAcceleration 
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>'
          }
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-event-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon })
        .bindPopup(`
          <div style="text-align: center; min-width: 100px;">
            <strong style="color: ${color}; text-transform: capitalize;">
              ${event.alert_type.replace(/_/g, " ")}
            </strong>
            <br/>
            <span style="font-size: 11px; color: #666;">
              ${event.severity} severity
            </span>
          </div>
        `)
        .addTo(map);

      eventMarkersRef.current.push(marker);
    });
  }, [events]);

  // Filter out low speeds (GPS noise when stationary) - threshold of 3 km/h
  const effectiveSpeedKmh = speedKmh !== null && speedKmh > 3 ? speedKmh : 0;
  const speedMph = Math.round(effectiveSpeedKmh * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '100dvh' }}>
      <div 
        ref={mapRef} 
        className="absolute inset-0" 
      />

      {/* Road Name Banner - Light theme style */}
      {latitude !== null && longitude !== null && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#142040] flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" style={{ transform: `rotate(${(heading ?? 0) - 45}deg)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-lg truncate">
                  {roadName || (latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Locating road...")}
                </p>
                <p className="text-gray-500 text-sm">
                  {heading !== null ? `Heading ${Math.round(heading)}°` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recenter button - Light theme style */}
      <button
        onClick={centerOnVehicle}
        className={`absolute bottom-36 left-4 z-20 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors border ${
          isAutoCenter 
            ? 'bg-[#142040] border-[#142040]' 
            : 'bg-white/95 backdrop-blur-sm border-gray-200'
        }`}
      >
        <Locate className={`w-6 h-6 ${isAutoCenter ? 'text-white' : 'text-[#142040]'}`} />
      </button>

      {/* Bottom Speed Panel - Light theme style */}
      {latitude !== null && longitude !== null && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-gray-300"></div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl px-6 py-5 shadow-lg border-t border-gray-200">
            <div className="flex items-center justify-around">
              {/* Current Speed */}
              <div className="flex flex-col items-center">
                <span className={`text-4xl font-bold ${isSpeeding ? 'text-red-500' : 'text-gray-900'}`}>
                  {speedMph}
                </span>
                <span className="text-gray-500 text-sm">mph</span>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gray-200"></div>

              {/* Speed Limit */}
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  isSpeeding ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                }`}>
                  <span className={`text-xl font-bold ${isSpeeding ? 'text-red-500' : 'text-gray-900'}`}>
                    {speedLimitMph ?? "—"}
                  </span>
                </div>
                <span className="text-gray-500 text-xs mt-1">limit</span>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gray-200"></div>

              {/* Route Points / Distance indicator */}
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-900">
                  {routePoints.length > 0 ? Math.round(routePoints.length / 10) / 10 : "0"}
                </span>
                <span className="text-gray-500 text-sm">km</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {(latitude === null || longitude === null) && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-[#142040] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-700 font-medium">Waiting for GPS signal...</p>
          <p className="text-xs text-gray-500 mt-1">
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
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          font-size: 8px !important;
          color: rgba(0,0,0,0.5) !important;
        }
        .leaflet-control-attribution a {
          color: rgba(0,0,0,0.6) !important;
        }
      `}</style>
    </div>
  );
}
