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
}

interface LiveMapProps {
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
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========== OSRM Road Matching ==========
async function matchToRoad(points: GPSPoint[]): Promise<GPSPoint[]> {
  if (points.length < 2) return points;
  
  // OSRM match API - batch up to 100 points at a time
  const batchSize = 100;
  const allMatched: GPSPoint[] = [];
  
  for (let i = 0; i < points.length; i += batchSize - 1) {
    const batch = points.slice(i, i + batchSize);
    if (batch.length < 2) {
      allMatched.push(...batch);
      continue;
    }
    
    const coords = batch.map(p => `${p.lng},${p.lat}`).join(";");
    const radiuses = batch.map(() => "25").join(";");
    
    try {
      const res = await fetch(
        `https://router.project-osrm.org/match/v1/driving/${coords}?overview=full&geometries=geojson&radiuses=${radiuses}`
      );
      if (!res.ok) {
        allMatched.push(...batch);
        continue;
      }
      const data = await res.json();
      if (data.code === "Ok" && data.matchings?.[0]?.geometry?.coordinates) {
        const matchedCoords = data.matchings[0].geometry.coordinates;
        const matchedPoints: GPSPoint[] = matchedCoords.map((c: number[]) => ({
          lat: c[1],
          lng: c[0],
        }));
        allMatched.push(...matchedPoints);
      } else {
        allMatched.push(...batch);
      }
    } catch {
      allMatched.push(...batch);
    }
  }
  
  return allMatched;
}

// ========== Component ==========
export default function LiveTrackingMap({
  latitude,
  longitude,
  heading,
  speedKmh,
  speedLimitKmh,
  isConnected,
  sessionId,
  roadName,
  className = "",
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routePointsRef = useRef<GPSPoint[]>([]);
  const matchedPointsRef = useRef<GPSPoint[]>([]);
  const lastPolyPointRef = useRef<GPSPoint | null>(null);
  const matchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMatchRef = useRef(false);

  const [userDragged, setUserDragged] = useState(false);

  // ========== Speed: simple filter ==========
  const displaySpeedKmh = (speedKmh !== null && speedKmh !== undefined && speedKmh >= 2 && speedKmh <= 160)
    ? speedKmh : 0;
  const speedMph = Math.round(displaySpeedKmh * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

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

    mapInstance.current.on("dragstart", () => setUserDragged(true));

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

  // ========== Road-match and update polyline ==========
  const triggerRoadMatch = useCallback(async () => {
    if (pendingMatchRef.current) return;
    const points = routePointsRef.current;
    if (points.length < 2) return;
    
    pendingMatchRef.current = true;
    try {
      const matched = await matchToRoad(points);
      matchedPointsRef.current = matched;
      renderPolyline(matched);
    } catch {
      // Fallback to raw points
      renderPolyline(points);
    } finally {
      pendingMatchRef.current = false;
    }
  }, []);

  const scheduleRoadMatch = useCallback(() => {
    if (matchDebounceRef.current) clearTimeout(matchDebounceRef.current);
    // Debounce road matching to every 5 seconds to avoid hammering OSRM
    matchDebounceRef.current = setTimeout(() => {
      triggerRoadMatch();
    }, 5000);
  }, [triggerRoadMatch]);

  // ========== Load Route History on session start ==========
  useEffect(() => {
    if (!sessionId) {
      routePointsRef.current = [];
      matchedPointsRef.current = [];
      lastPolyPointRef.current = null;
      polylineRef.current?.remove();
      polylineRef.current = null;
      if (matchDebounceRef.current) clearTimeout(matchDebounceRef.current);
      return;
    }

    const loadHistory = async () => {
      const { data } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(2000);

      if (data && data.length > 0) {
        const points: GPSPoint[] = [];
        let lastValid: GPSPoint | null = null;

        for (const row of data) {
          if (!row.latitude || !row.longitude) continue;
          const point: GPSPoint = { lat: row.latitude, lng: row.longitude };

          if (!lastValid) {
            points.push(point);
            lastValid = point;
          } else {
            const dist = haversineDistance(lastValid.lat, lastValid.lng, point.lat, point.lng);
            if (dist >= 3) { // 3m jitter filter
              points.push(point);
              lastValid = point;
            }
          }
        }

        routePointsRef.current = points;
        lastPolyPointRef.current = points[points.length - 1] || null;
        // Road-match the history immediately
        triggerRoadMatch();
      }
    };

    loadHistory();
  }, [sessionId, triggerRoadMatch]);

  // ========== SINGLE DATA FLOW: props change -> marker + polyline ==========
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || latitude === null || longitude === null) {
      // Remove marker if no position
      if (latitude === null && longitude === null) {
        markerRef.current?.remove();
        markerRef.current = null;
      }
      return;
    }

    // --- Update marker ---
    const rotation = heading ?? 0;
    const bgColor = isConnected ? '#3b82f6' : '#9ca3af';
    const iconHtml = `
      <div class="gps-car-marker" style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
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
      className: "gps-marker-icon",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    }

    // --- Auto-center ---
    if (!userDragged) {
      map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
    }

    // --- Add to polyline (3m jitter filter) ---
    if (sessionId) {
      const lastPoly = lastPolyPointRef.current;
      let shouldAdd = false;

      if (!lastPoly) {
        shouldAdd = true;
      } else {
        const dist = haversineDistance(lastPoly.lat, lastPoly.lng, latitude, longitude);
        shouldAdd = dist >= 3;
      }

      if (shouldAdd) {
        const newPoint: GPSPoint = { lat: latitude, lng: longitude };
        routePointsRef.current.push(newPoint);
        lastPolyPointRef.current = newPoint;
        // Show raw point immediately, then schedule road-match
        renderPolyline(routePointsRef.current);
        scheduleRoadMatch();
      }
    }
  }, [latitude, longitude, heading, isConnected, userDragged, sessionId, scheduleRoadMatch]);

  // ========== Polyline renderer ==========
  const renderPolyline = useCallback((points: GPSPoint[]) => {
    const map = mapInstance.current;
    if (!map) return;
    if (points.length < 2) return;

    const latlngs = points.map(p => [p.lat, p.lng] as L.LatLngExpression);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
    } else {
      polylineRef.current = L.polyline(latlngs, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.8,
      }).addTo(map);
    }
  }, []);
  // ========== Re-center Handler ==========
  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapInstance.current && latitude !== null && longitude !== null) {
      mapInstance.current.setView([latitude, longitude], mapInstance.current.getZoom(), { animate: true });
    }
  }, [latitude, longitude]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* Re-center button */}
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
      {sessionId && (isConnected || latitude !== null) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className={`backdrop-blur-sm rounded-none px-4 py-3 shadow-lg border ${
            isSpeeding ? "bg-destructive/10 border-destructive/50" : "bg-background/95"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1 shrink-0">
                <span className={`text-4xl font-bold transition-colors ${isSpeeding ? "text-destructive" : "text-foreground"}`}>
                  {speedMph}
                </span>
                <span className="text-muted-foreground text-sm">mph</span>
              </div>

              <div className="flex-1 min-w-0 text-center">
                <p className="text-foreground font-medium truncate">{roadName || "—"}</p>
              </div>

              <div className={`w-12 h-12 shrink-0 rounded-full bg-background border-4 flex items-center justify-center border-destructive`}>
                <span className={`text-lg font-bold transition-colors ${isSpeeding ? "text-destructive" : "text-foreground"}`}>
                  {speedLimitMph ?? "—"}
                </span>
              </div>
            </div>

            {isSpeeding && (
              <div className="mt-2 pt-2 border-t border-destructive/30 text-center">
                <p className="text-sm font-semibold text-destructive animate-pulse">⚠️ OVER SPEED LIMIT</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {latitude === null && longitude === null && routePointsRef.current.length === 0 && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-foreground font-medium">Waiting for GPS...</p>
        </div>
      )}

      <style>{`
        .gps-marker-icon { background: transparent !important; border: none !important; }
        .gps-car-marker { pointer-events: none; }
        .leaflet-marker-icon { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
