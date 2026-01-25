import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTomTomTileUrl, getTomTomAttribution } from "@/lib/tomtomConfig";
import { supabase } from "@/integrations/supabase/client";

interface TraccarLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  isConnected: boolean;
  sessionId: string | null;
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
  className = "",
}: TraccarLiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  // Fetch route points for active session
  useEffect(() => {
    if (!sessionId) {
      setRoutePoints([]);
      return;
    }

    const fetchRoutePoints = async () => {
      const { data, error } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(500);

      if (!error && data) {
        setRoutePoints(
          data.map((p) => ({ lat: p.latitude, lng: p.longitude }))
        );
      }
    };

    fetchRoutePoints();
    const interval = setInterval(fetchRoutePoints, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [54.0, -2.0], // UK center
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(getTomTomTileUrl(), {
      attribution: getTomTomAttribution(),
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add attribution to bottom left
    L.control.attribution({ position: "bottomleft" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Update marker and pan map
  useEffect(() => {
    if (!mapRef.current || latitude === null || longitude === null) return;

    const map = mapRef.current;
    const position: L.LatLngExpression = [latitude, longitude];

    // Determine marker color based on connection status
    const markerColor = isConnected ? "#22c55e" : "#f59e0b";
    const rotation = heading || 0;
    const speedMph = speedKmh !== null ? Math.round(speedKmh * 0.621371) : null;

    // Create custom arrow icon with speed
    const createArrowIcon = () => {
      const html = `
        <div class="relative flex items-center justify-center" style="width: 50px; height: 50px;">
          <div 
            class="absolute inset-0 flex items-center justify-center"
            style="transform: rotate(${rotation}deg);"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="${markerColor}" stroke="white" stroke-width="1.5">
              <path d="M12 2L4 20L12 16L20 20L12 2Z"/>
            </svg>
          </div>
          ${speedMph !== null ? `
            <div 
              class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-2 py-0.5 shadow-md border-2 text-xs font-bold whitespace-nowrap"
              style="border-color: ${markerColor}; color: ${markerColor};"
            >
              ${speedMph}
            </div>
          ` : ''}
        </div>
      `;

      return L.divIcon({
        html,
        className: "traccar-live-marker",
        iconSize: [50, 70],
        iconAnchor: [25, 25],
      });
    };

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      markerRef.current.setIcon(createArrowIcon());
    } else {
      markerRef.current = L.marker(position, {
        icon: createArrowIcon(),
      }).addTo(map);
    }

    // Pan map to position
    map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  }, [latitude, longitude, heading, speedKmh, isConnected]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (routePoints.length > 1) {
      const latLngs: L.LatLngExpression[] = routePoints.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      routeLineRef.current = L.polyline(latLngs, {
        color: "#3b82f6",
          weight: 4,
          opacity: 0.7,
        }
      ).addTo(map);
    }
  }, [routePoints]);

  const speedMph = speedKmh !== null ? Math.round(speedKmh * 0.621371) : null;

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[250px]" />

      {/* Speed roundel overlay */}
      {speedMph !== null && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-destructive shadow-lg">
            <div className="text-center">
              <span className="text-xl font-bold text-foreground">{speedMph}</span>
              <span className="block text-[10px] font-medium text-muted-foreground -mt-1">
                MPH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connection status badge */}
      <div className="absolute top-3 right-3 z-[1000]">
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium shadow-md ${
            isConnected
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-white animate-pulse" : "bg-white/60"
            }`}
          />
          {isConnected ? "Live" : "Stale"}
        </div>
      </div>

      {/* Waiting for GPS overlay */}
      {(latitude === null || longitude === null) && (
        <div className="absolute inset-0 z-[1000] bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Waiting for GPS...</p>
          </div>
        </div>
      )}
    </div>
  );
}
