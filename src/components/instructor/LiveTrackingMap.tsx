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
  const [livePosition, setLivePosition] = useState<{lat: number; lng: number} | null>(null);
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
      setLivePosition(null);
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
            setDisplaySpeed(processSpeed(point.speedKmh));
            // Update live position for marker (real-time movement)
            setLivePosition({ lat: point.lat, lng: point.lng });
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

  // ========== Add points from props for instant tracking line ==========
  // This catches position updates from polling before they hit the database
  useEffect(() => {
    if (!sessionId || latitude === null || longitude === null) return;
    
    const point: GPSPoint = {
      lat: latitude,
      lng: longitude,
      speedKmh: speedKmh ?? undefined,
    };
    
    const { isValid } = validatePoint(point, lastValidPointRef.current);
    
    if (isValid) {
      // Check if this point is different from the last one in filteredPoints
      const lastPoint = filteredPoints[filteredPoints.length - 1];
      if (!lastPoint || lastPoint.lat !== latitude || lastPoint.lng !== longitude) {
        setFilteredPoints((prev) => [...prev, point]);
        lastValidPointRef.current = point;
        setLivePosition({ lat: latitude, lng: longitude });
      }
    }
  }, [sessionId, latitude, longitude, speedKmh]);

  // ========== Compute Marker Position (live > props) ==========
  const markerLat = livePosition?.lat ?? latitude;
  const markerLng = livePosition?.lng ?? longitude;

  // ========== Update Marker ==========
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (markerLat === null || markerLng === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const rotation = heading ?? 0;

    // Car icon SVG - points up by default
    const bgColor = isConnected ? '#3b82f6' : '#9ca3af';
    const iconHtml = `
      <div class="traccar-car-marker" style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${bgColor};box-shadow:0 3px 12px rgba(0,0,0,0.25);"></div>
        <div style="position:relative;width:24px;height:24px;transform:rotate(${rotation}deg);transition:transform 0.5s ease;z-index:1;">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
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
      markerRef.current = L.marker([markerLat, markerLng], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([markerLat, markerLng]);
      markerRef.current.setIcon(icon);
    }

    // Auto-center unless user dragged
    if (!userDragged) {
      map.setView([markerLat, markerLng], map.getZoom(), { animate: true });
    }
  }, [markerLat, markerLng, heading, userDragged]);

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

  // ========== Update Display Speed from Props - Instant ==========
  useEffect(() => {
    // Use prop speed immediately for instant updates
    if (speedKmh !== null && speedKmh !== undefined) {
      setDisplaySpeed(processSpeed(speedKmh));
    } else if (!isConnected) {
      setDisplaySpeed(0);
    }
  }, [speedKmh, isConnected]);

  // ========== Re-center Handler ==========
  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapInstance.current && markerLat !== null && markerLng !== null) {
      mapInstance.current.setView([markerLat, markerLng], mapInstance.current.getZoom(), {
        animate: true,
      });
    }
  }, [markerLat, markerLng]);

  // ========== Speed Display Calculations ==========
  const speedMph = Math.round(displaySpeed * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* Re-center button - shows when user has dragged */}
      {userDragged && markerLat !== null && markerLng !== null && (
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

      {/* Speed display panel - only visible during active session */}
      {sessionId && (isConnected || markerLat !== null) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className={`backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border ${
            isSpeeding 
              ? "bg-destructive/10 border-destructive/50" 
              : "bg-background/95"
          }`}>
            <div className="flex items-center justify-between gap-3">
              {/* Current Speed */}
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  className={`text-4xl font-bold transition-colors ${
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
              </div>

              {/* Speed Limit Roundel */}
              <div className={`w-12 h-12 shrink-0 rounded-full bg-background border-4 flex items-center justify-center transition-colors ${
                isSpeeding ? "border-destructive" : "border-destructive"
              }`}>
                <span
                  className={`text-lg font-bold transition-colors ${
                    isSpeeding ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {speedLimitMph ?? "—"}
                </span>
              </div>
            </div>
            
            {/* Overspeeding warning banner */}
            {isSpeeding && (
              <div className="mt-2 pt-2 border-t border-destructive/30 text-center">
                <p className="text-sm font-semibold text-destructive animate-pulse">
                  ⚠️ OVER SPEED LIMIT
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state - only show when truly no position data exists */}
      {latitude === null && longitude === null && filteredPoints.length === 0 && !livePosition && (
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
