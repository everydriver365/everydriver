import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

interface GPSPoint {
  lat: number;
  lng: number;
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
  className?: string;
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
  className = "",
}: TraccarLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [points, setPoints] = useState<GPSPoint[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initialLat = latitude ?? 54.5;
    const initialLng = longitude ?? -3.5;

    mapInstance.current = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Load route history when session changes
  useEffect(() => {
    if (!sessionId) {
      setPoints([]);
      polylineRef.current?.remove();
      polylineRef.current = null;
      return;
    }

    const loadHistory = async () => {
      const { data } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(2000);

      if (data) {
        setPoints(
          data
            .filter((p) => p.latitude && p.longitude)
            .map((p) => ({ lat: p.latitude!, lng: p.longitude! }))
        );
      }
    };

    loadHistory();
  }, [sessionId]);

  // Subscribe to realtime GPS updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live-tracking-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telematics_gps_points",
          filter: `telematics_id=eq.${sessionId}`,
        },
        (payload) => {
          const p = payload.new as { latitude: number; longitude: number };
          if (p.latitude && p.longitude) {
            setPoints((prev) => [...prev, { lat: p.latitude, lng: p.longitude }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Update marker position from props (real-time device updates)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const rotation = heading ?? 0;

    const iconHtml = `
      <div style="position: relative; width: 40px; height: 40px; transform: translate(-20px, -20px);">
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
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
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
      className: "custom-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    }

    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, heading]);

  // Update polyline when points change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || points.length < 2) return;

    polylineRef.current?.remove();
    polylineRef.current = L.polyline(
      points.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      { color: "#3b82f6", weight: 5, opacity: 0.8 }
    ).addTo(map);
  }, [points]);

  // Filter low speeds (GPS noise)
  const effectiveSpeedKmh = speedKmh !== null && speedKmh > 3 ? speedKmh : 0;
  const speedMph = Math.round(effectiveSpeedKmh * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* Simple speed display */}
      {latitude !== null && longitude !== null && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border">
            <div className="flex items-center justify-between">
              {/* Current Speed */}
              <div className="text-center">
                <span className={`text-4xl font-bold ${isSpeeding ? 'text-destructive' : 'text-foreground'}`}>
                  {speedMph}
                </span>
                <span className="text-muted-foreground text-sm ml-1">mph</span>
              </div>

              {/* Road Name */}
              <div className="flex-1 text-center px-4">
                <p className="text-foreground font-medium truncate">
                  {roadName || "—"}
                </p>
                {!isConnected && (
                  <p className="text-xs text-muted-foreground">No GPS signal</p>
                )}
              </div>

              {/* Speed Limit */}
              <div className="w-14 h-14 rounded-full bg-background border-4 border-destructive flex items-center justify-center">
                <span className={`text-xl font-bold ${isSpeeding ? 'text-destructive' : 'text-foreground'}`}>
                  {speedLimitMph ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {(latitude === null || longitude === null) && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-foreground font-medium">Waiting for GPS...</p>
        </div>
      )}

      <style>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
