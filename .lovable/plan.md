Below are the two files that implement phone GPS streaming and the live Leaflet map. Copy each block into the matching path.

## 1. `src/hooks/usePhoneTrackingStreamer.ts`

Streams `navigator.geolocation.watchPosition` fixes into Supabase (`update_live_position` for the live cursor, `record_phone_gps_point` for the trip history). Includes accuracy gating (>35m dropped), 5m/3kmh stationary jitter filter, screen wake-lock, and cached speed-limit resolution.

```ts
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePhoneSpeedLimit, haversineMetres } from "@/lib/phoneSpeedLimit";

export interface PhoneFix {
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
  speedLimitKmh?: number | null;
}

interface Options {
  provider: "phone" | "radius" | null;
  pupilId: string | null;
  sessionId?: string | null;
  minIntervalMs?: number;
  onPosition?: (fix: PhoneFix) => void;
}

export function usePhoneTrackingStreamer({
  provider,
  pupilId,
  sessionId = null,
  minIntervalMs = 2000,
  onPosition,
}: Options) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastLimitFetchRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const cachedLimitRef = useRef<number | null>(null);

  useEffect(() => {
    if (provider !== "phone") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("[PhoneTracking] geolocation API unavailable");
      return;
    }

    let cancelled = false;
    lastPointRef.current = null;
    lastLimitFetchRef.current = null;
    cachedLimitRef.current = null;

    (async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* ignore */ }
    })();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (cancelled) return;
        const now = Date.now();
        if (now - lastSentRef.current < minIntervalMs) return;

        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        if (accuracy != null && accuracy > 35) return;

        lastSentRef.current = now;
        const speedKmh = speed != null && !Number.isNaN(speed) ? speed * 3.6 : 0;

        let distanceDeltaKm = 0;
        let movedSinceLast = 0;
        if (lastPointRef.current) {
          movedSinceLast = haversineMetres(
            lastPointRef.current.lat, lastPointRef.current.lng,
            latitude, longitude,
          );
          if (movedSinceLast < 5 && speedKmh < 3) return;
          if (movedSinceLast < 500) distanceDeltaKm = movedSinceLast / 1000;
        }
        lastPointRef.current = { lat: latitude, lng: longitude };

        const lastFetch = lastLimitFetchRef.current;
        const movedFar = !lastFetch || haversineMetres(
          lastFetch.lat, lastFetch.lng, latitude, longitude,
        ) > 60;
        const stale = !lastFetch || (now - lastFetch.at) > 20000;
        if (cachedLimitRef.current == null || movedFar || stale) {
          lastLimitFetchRef.current = { lat: latitude, lng: longitude, at: now };
          try {
            cachedLimitRef.current = await resolvePhoneSpeedLimit(latitude, longitude);
          } catch { /* keep previous */ }
        }
        const speedLimitKmh = cachedLimitRef.current;

        try {
          onPosition?.({
            latitude, longitude, speedKmh,
            heading: heading != null && !Number.isNaN(heading) ? heading : null,
            accuracy: accuracy ?? null,
            timestamp: pos.timestamp ?? now,
            speedLimitKmh,
          });
        } catch { /* ignore */ }

        if (pupilId) {
          try {
            await supabase.rpc("update_live_position", {
              p_pupil_id: pupilId,
              p_latitude: latitude,
              p_longitude: longitude,
              p_speed_kmh: speedKmh,
              p_heading: heading != null && !Number.isNaN(heading) ? heading : null,
              p_accuracy: accuracy ?? null,
              p_trip_status: "driving",
              p_session_id: sessionId,
              p_speed_limit_kmh: speedLimitKmh ?? null,
            } as any);
          } catch (err) {
            console.warn("[PhoneTracking] update_live_position failed:", err);
          }
        }

        if (sessionId) {
          try {
            await supabase.rpc("record_phone_gps_point", {
              p_session_id: sessionId,
              p_latitude: latitude,
              p_longitude: longitude,
              p_speed_kmh: speedKmh,
              p_heading: heading != null && !Number.isNaN(heading) ? heading : null,
              p_accuracy: accuracy ?? null,
              p_speed_limit_kmh: speedLimitKmh ?? null,
              p_road_name: null,
              p_distance_delta_km: distanceDeltaKm,
            } as any);
          } catch (err) {
            console.warn("[PhoneTracking] record_phone_gps_point failed:", err);
          }
        }
      },
      (err) => console.warn("[PhoneTracking] geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 10000 }
    );

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [provider, pupilId, sessionId, minIntervalMs]);
}
```

## 2. `src/components/instructor/LiveTrackingMap.tsx`

Leaflet-based live map: car-icon marker that rotates with heading, auto-pan unless the user drags, polyline of the trip with OSRM snap-to-road debounced every 5s, 3m jitter filter, history reload from `telematics_gps_points`, and a bottom panel showing speed (mph), road name, and speed-limit roundel with over-limit warning.

```tsx
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

interface GPSPoint { lat: number; lng: number; }

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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function matchToRoad(points: GPSPoint[]): Promise<GPSPoint[]> {
  if (points.length < 2) return points;
  const batchSize = 100;
  const allMatched: GPSPoint[] = [];
  for (let i = 0; i < points.length; i += batchSize - 1) {
    const batch = points.slice(i, i + batchSize);
    if (batch.length < 2) { allMatched.push(...batch); continue; }
    const coords = batch.map(p => `${p.lng},${p.lat}`).join(";");
    const radiuses = batch.map(() => "25").join(";");
    try {
      const res = await fetch(
        `https://router.project-osrm.org/match/v1/driving/${coords}?overview=full&geometries=geojson&radiuses=${radiuses}`
      );
      if (!res.ok) { allMatched.push(...batch); continue; }
      const data = await res.json();
      if (data.code === "Ok" && data.matchings?.[0]?.geometry?.coordinates) {
        allMatched.push(...data.matchings[0].geometry.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] })));
      } else {
        allMatched.push(...batch);
      }
    } catch { allMatched.push(...batch); }
  }
  return allMatched;
}

export default function LiveTrackingMap({
  latitude, longitude, heading, speedKmh, speedLimitKmh,
  isConnected, sessionId, roadName, className = "",
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

  const displaySpeedKmh = (speedKmh != null && speedKmh >= 2 && speedKmh <= 160) ? speedKmh : 0;
  const speedMph = Math.round(displaySpeedKmh * 0.621371);
  const speedLimitMph = speedLimitKmh !== null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      center: [latitude ?? 54.5, longitude ?? -3.5],
      zoom: 17, zoomControl: false, attributionControl: false,
    });
    L.tileLayer(getMapTileUrl(), { maxZoom: 19, attribution: getMapAttribution() }).addTo(mapInstance.current);
    mapInstance.current.on("dragstart", () => setUserDragged(true));
    const ro = new ResizeObserver(() => mapInstance.current?.invalidateSize());
    ro.observe(mapRef.current);
    return () => { ro.disconnect(); mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  const renderPolyline = useCallback((points: GPSPoint[]) => {
    const map = mapInstance.current;
    if (!map || points.length < 2) return;
    const latlngs = points.map(p => [p.lat, p.lng] as L.LatLngExpression);
    if (polylineRef.current) polylineRef.current.setLatLngs(latlngs);
    else polylineRef.current = L.polyline(latlngs, { color: "#3b82f6", weight: 5, opacity: 0.8 }).addTo(map);
  }, []);

  const triggerRoadMatch = useCallback(async () => {
    if (pendingMatchRef.current) return;
    const points = routePointsRef.current;
    if (points.length < 2) return;
    pendingMatchRef.current = true;
    try {
      const matched = await matchToRoad(points);
      matchedPointsRef.current = matched;
      renderPolyline(matched);
    } catch { renderPolyline(points); }
    finally { pendingMatchRef.current = false; }
  }, [renderPolyline]);

  const scheduleRoadMatch = useCallback(() => {
    if (matchDebounceRef.current) clearTimeout(matchDebounceRef.current);
    matchDebounceRef.current = setTimeout(() => triggerRoadMatch(), 5000);
  }, [triggerRoadMatch]);

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
    (async () => {
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
          const p: GPSPoint = { lat: row.latitude, lng: row.longitude };
          if (!lastValid) { points.push(p); lastValid = p; }
          else if (haversineDistance(lastValid.lat, lastValid.lng, p.lat, p.lng) >= 3) {
            points.push(p); lastValid = p;
          }
        }
        routePointsRef.current = points;
        lastPolyPointRef.current = points[points.length - 1] || null;
        triggerRoadMatch();
      }
    })();
  }, [sessionId, triggerRoadMatch]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || latitude === null || longitude === null) {
      if (latitude === null && longitude === null) {
        markerRef.current?.remove();
        markerRef.current = null;
      }
      return;
    }
    const rotation = heading ?? 0;
    const bgColor = isConnected ? "#3b82f6" : "#9ca3af";
    const iconHtml = `
      <div class="gps-car-marker" style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${bgColor};box-shadow:0 3px 12px rgba(0,0,0,0.25);"></div>
        <div style="position:relative;width:24px;height:24px;transform:rotate(${rotation}deg);transition:transform 0.5s ease;z-index:1;">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      </div>`;
    const icon = L.divIcon({ html: iconHtml, className: "gps-marker-icon", iconSize: [48, 48], iconAnchor: [24, 24] });
    if (!markerRef.current) markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    else { markerRef.current.setLatLng([latitude, longitude]); markerRef.current.setIcon(icon); }
    if (!userDragged) map.panTo([latitude, longitude], { animate: true, duration: 0.5 });

    if (sessionId) {
      const lastPoly = lastPolyPointRef.current;
      const shouldAdd = !lastPoly || haversineDistance(lastPoly.lat, lastPoly.lng, latitude, longitude) >= 3;
      if (shouldAdd) {
        const newPoint: GPSPoint = { lat: latitude, lng: longitude };
        routePointsRef.current.push(newPoint);
        lastPolyPointRef.current = newPoint;
        renderPolyline(routePointsRef.current);
        scheduleRoadMatch();
      }
    }
  }, [latitude, longitude, heading, isConnected, userDragged, sessionId, scheduleRoadMatch, renderPolyline]);

  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapInstance.current && latitude !== null && longitude !== null) {
      mapInstance.current.setView([latitude, longitude], mapInstance.current.getZoom(), { animate: true });
    }
  }, [latitude, longitude]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {userDragged && latitude !== null && longitude !== null && (
        <Button variant="secondary" size="sm"
          className="absolute top-4 right-4 z-20 shadow-lg"
          onClick={handleRecenter}>
          <Crosshair className="h-4 w-4 mr-1" /> Center
        </Button>
      )}

      {sessionId && (isConnected || latitude !== null) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className={`backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border ${
            isSpeeding ? "bg-destructive/10 border-destructive/50" : "bg-background/95"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1 shrink-0">
                <span className={`text-4xl font-bold transition-colors ${isSpeeding ? "text-destructive" : "text-foreground"}`}>{speedMph}</span>
                <span className="text-muted-foreground text-sm">mph</span>
              </div>
              <div className="flex-1 min-w-0 text-center">
                <p className="text-foreground font-medium truncate">{roadName || "—"}</p>
              </div>
              <div className="w-12 h-12 shrink-0 rounded-full bg-background border-4 flex items-center justify-center border-destructive">
                <span className={`text-lg font-bold transition-colors ${isSpeeding ? "text-destructive" : "text-foreground"}`}>{speedLimitMph ?? "—"}</span>
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
```

## How they wire together

```tsx
const [fix, setFix] = useState<PhoneFix | null>(null);

usePhoneTrackingStreamer({
  provider: "phone",
  pupilId,
  sessionId,
  onPosition: setFix,
});

<LiveTrackingMap
  latitude={fix?.latitude ?? null}
  longitude={fix?.longitude ?? null}
  heading={fix?.heading ?? null}
  speedKmh={fix?.speedKmh ?? null}
  speedLimitKmh={fix?.speedLimitKmh ?? null}
  isConnected={!!fix}
  sessionId={sessionId}
/>
```

## Required dependencies

- `leaflet` and `leaflet/dist/leaflet.css`
- Supabase RPCs: `update_live_position`, `record_phone_gps_point`
- Supabase table: `telematics_gps_points (telematics_id, latitude, longitude, recorded_at)`
- Helpers: `@/lib/phoneSpeedLimit` (exports `resolvePhoneSpeedLimit`, `haversineMetres`), `@/lib/mapConfig` (exports `getMapTileUrl`, `getMapAttribution`)
