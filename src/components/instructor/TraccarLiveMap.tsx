import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

// ========== Types ==========
interface GPSPoint {
  lat: number;
  lng: number;
  speedKmh?: number;
  accuracy?: number;
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

// ========== Haversine Distance (meters) ==========
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ========== GPS Point Validator ==========
interface ValidationResult {
  isValid: boolean;
  distance: number;
}

function validatePoint(
  point: GPSPoint,
  lastValidPoint: GPSPoint | null,
  accuracyThreshold = 20, // Tighter accuracy filter (was 25)
  minDistanceThreshold = 5, // Minimum movement (was 10)
  maxDistanceThreshold = 500 // NEW: Max distance to prevent GPS jumps (500m)
): ValidationResult {
  // 1. Check GPS accuracy (reject poor signals)
  if (point.accuracy !== undefined && point.accuracy > accuracyThreshold) {
    return { isValid: false, distance: 0 };
  }

  // 2. First point is always valid
  if (!lastValidPoint) {
    return { isValid: true, distance: 0 };
  }

  // 3. Calculate distance from last valid point
  const distance = haversineDistance(
    lastValidPoint.lat,
    lastValidPoint.lng,
    point.lat,
    point.lng
  );

  // 4. Reject if distance is below minimum threshold (GPS jitter)
  if (distance < minDistanceThreshold) {
    return { isValid: false, distance };
  }

  // 5. NEW: Reject if distance is too large (GPS jump/signal loss)
  // This prevents straight lines across the map when GPS signal is lost
  if (distance > maxDistanceThreshold) {
    console.log(`[GPS] Rejecting point: distance ${distance.toFixed(0)}m exceeds max ${maxDistanceThreshold}m`);
    return { isValid: false, distance };
  }

  return { isValid: true, distance };
}

// ========== Speed Processing ==========
function processSpeed(speedKmh: number | null | undefined): number {
  if (speedKmh === null || speedKmh === undefined) return 0;
  
  // Cap unrealistic speeds (> 160 km/h = ~100 mph)
  if (speedKmh > 160) return 0;
  
  // Filter GPS noise (speeds below 3 km/h are likely stationary)
  if (speedKmh < 3) return 0;
  
  return speedKmh;
}

// ========== Component ==========
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

  const [filteredPoints, setFilteredPoints] = useState<GPSPoint[]>([]);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [userDragged, setUserDragged] = useState(false);
  const lastValidPointRef = useRef<GPSPoint | null>(null);

  // ========== Initialize Map ==========
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

    L.tileLayer(getMapTileUrl(), {
      maxZoom: 19,
      attribution: getMapAttribution(),
    }).addTo(mapInstance.current);

    // Track user drag to disable auto-center
    mapInstance.current.on("dragstart", () => {
      setUserDragged(true);
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.current?.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // ========== Load Route History ==========
  useEffect(() => {
    if (!sessionId) {
      setFilteredPoints([]);
      lastValidPointRef.current = null;
      polylineRef.current?.remove();
      polylineRef.current = null;
      return;
    }

    const loadHistory = async () => {
      const { data } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude, speed_kmh, accuracy_m")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(2000);

      if (data) {
        const validPoints: GPSPoint[] = [];
        let lastValid: GPSPoint | null = null;

        for (const row of data) {
          if (!row.latitude || !row.longitude) continue;

          const point: GPSPoint = {
            lat: row.latitude,
            lng: row.longitude,
            speedKmh: row.speed_kmh ?? undefined,
            accuracy: row.accuracy_m ?? undefined,
          };

          const { isValid } = validatePoint(point, lastValid);
          if (isValid) {
            validPoints.push(point);
            lastValid = point;
          }
        }

        setFilteredPoints(validPoints);
        lastValidPointRef.current = lastValid;
      }
    };

    loadHistory();
  }, [sessionId]);

  // ========== Realtime GPS Subscription ==========
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
          const row = payload.new as {
            latitude: number;
            longitude: number;
            speed_kmh?: number;
            accuracy_m?: number;
          };

          if (!row.latitude || !row.longitude) return;

          const point: GPSPoint = {
            lat: row.latitude,
            lng: row.longitude,
            speedKmh: row.speed_kmh,
            accuracy: row.accuracy_m,
          };

          const { isValid } = validatePoint(point, lastValidPointRef.current);

          if (isValid) {
            setFilteredPoints((prev) => [...prev, point]);
            lastValidPointRef.current = point;
            // Update speed from validated point
            setDisplaySpeed(processSpeed(point.speedKmh));
          } else {
            // Point rejected - set speed to 0 (stationary)
            setDisplaySpeed(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // ========== Update Marker from Props ==========
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const rotation = heading ?? 0;

    // Car icon SVG - points up by default
    const iconHtml = `
      <div class="traccar-car-marker" style="
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.25);
        "></div>
        <div style="
          position: relative;
          width: 28px;
          height: 28px;
          transform: rotate(${rotation}deg);
          z-index: 1;
        ">
          <svg viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: "traccar-marker-icon",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    }

    // Auto-center unless user dragged
    if (!userDragged) {
      map.setView([latitude, longitude], map.getZoom(), { animate: true });
    }
  }, [latitude, longitude, heading, userDragged]);

  // ========== Update Polyline ==========
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || filteredPoints.length < 2) return;

    polylineRef.current?.remove();
    polylineRef.current = L.polyline(
      filteredPoints.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      { color: "#3b82f6", weight: 5, opacity: 0.8 }
    ).addTo(map);
  }, [filteredPoints]);

  // ========== Update Display Speed from Props ==========
  useEffect(() => {
    // Only use prop speed when connected and not receiving realtime updates
    if (isConnected && speedKmh !== null) {
      setDisplaySpeed(processSpeed(speedKmh));
    } else if (!isConnected) {
      setDisplaySpeed(0);
    }
  }, [speedKmh, isConnected]);

  // ========== Re-center Handler ==========
  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapInstance.current && latitude !== null && longitude !== null) {
      mapInstance.current.setView([latitude, longitude], mapInstance.current.getZoom(), {
        animate: true,
      });
    }
  }, [latitude, longitude]);

  // ========== Speed Display Calculations ==========
  const speedMph = Math.round(displaySpeed * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* Re-center button - shows when user has dragged */}
      {userDragged && latitude !== null && longitude !== null && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 z-20 shadow-lg"
          onClick={handleRecenter}
        >
          <Crosshair className="h-4 w-4 mr-1" />
          Center
        </Button>
      )}

      {/* Speed display panel */}
      {latitude !== null && longitude !== null && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border">
            <div className="flex items-center justify-between gap-3">
              {/* Current Speed */}
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  className={`text-4xl font-bold ${
                    isSpeeding ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {speedMph}
                </span>
                <span className="text-muted-foreground text-sm">mph</span>
              </div>

              {/* Road Name */}
              <div className="flex-1 min-w-0 text-center">
                <p className="text-foreground font-medium truncate">
                  {roadName || "—"}
                </p>
                {!isConnected && (
                  <p className="text-xs text-muted-foreground">No GPS signal</p>
                )}
              </div>

              {/* Speed Limit */}
              <div className="w-12 h-12 shrink-0 rounded-full bg-background border-4 border-destructive flex items-center justify-center">
                <span
                  className={`text-lg font-bold ${
                    isSpeeding ? "text-destructive" : "text-foreground"
                  }`}
                >
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
        .traccar-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .traccar-car-marker {
          pointer-events: none;
        }
        .leaflet-marker-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
