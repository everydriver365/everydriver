import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

// ========== Types ==========
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

type PointRow = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

// ========== Helpers ==========
function kmhToMph(kmh: number) {
  return kmh * 0.621371;
}

function formatAgo(iso: string | null) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// ========== Google Maps loader ==========
function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.maps) return resolve();

    const existing = document.querySelector('script[data-google-maps="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load")));
      return;
    }

    const s = document.createElement("script");
    s.dataset.googleMaps = "1";
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(s);
  });
}

// ========== Snap-to-road via edge function ==========
async function callSnapToRoad(
  points: Array<{ lat: number; lng: number }>
): Promise<Array<{ lat: number; lng: number }>> {
  const { data: session } = await supabase.auth.getSession();
  const jwt = session?.session?.access_token ?? null;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/snap-to-road`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ points, interpolate: true }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Snap-to-road failed");

  return (data.snapped || [])
    .filter((p: any) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
    .map((p: any) => ({ lat: p.lat, lng: p.lng }));
}

// ========== Fetch Google Maps API key from edge function ==========
async function fetchGoogleMapsKey(): Promise<string> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/get-google-maps-key`;

  const res = await fetch(url, {
    headers: { apikey: anonKey },
  });
  const data = await res.json();
  return data?.key || "";
}

// ========== Component ==========
export default function GoogleLiveTrackingMap({
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
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [status, setStatus] = useState("Loading map…");
  const [note, setNote] = useState<string | null>(null);
  const [userDragged, setUserDragged] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Rolling raw points for route
  const rawPointsRef = useRef<Array<{ lat: number; lng: number; t: string }>>([]);
  const lastFetchedAtRef = useRef<string | null>(null);

  // Speed calculations
  const displaySpeedKmh = (speedKmh !== null && speedKmh !== undefined && speedKmh >= 2 && speedKmh <= 160)
    ? speedKmh : 0;
  const speedMph = Math.round(displaySpeedKmh * 0.621371);
  const speedLimitMph = speedLimitKmh !== null && speedLimitKmh !== undefined
    ? Math.round(speedLimitKmh * 0.621371) : null;
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;

  // 1) Load Google Maps API key and init map
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapDivRef.current || mapRef.current) return;

      try {
        const apiKey = await fetchGoogleMapsKey();
        if (!apiKey) {
          setStatus("Google Maps API key not configured");
          return;
        }
        if (cancelled) return;

        await loadGoogleMaps(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const w = window as any;
        const center =
          latitude != null && longitude != null
            ? { lat: latitude, lng: longitude }
            : { lat: 51.5072, lng: -0.1276 };

        const map = new w.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapRef.current = map;

        markerRef.current = new w.google.maps.Marker({
          position: center,
          map,
          title: "Live position",
        });

        polylineRef.current = new w.google.maps.Polyline({
          map,
          path: [],
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });

        // Detect user dragging
        map.addListener("dragstart", () => setUserDragged(true));

        setMapsLoaded(true);
        setStatus("Live");
      } catch (e: any) {
        if (!cancelled) setStatus(e?.message ?? "Map init failed");
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // 2) Update marker whenever position changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (latitude == null || longitude == null) return;

    const pos = { lat: latitude, lng: longitude };
    marker.setPosition(pos);

    if (!userDragged) {
      map.panTo(pos);
    }

    const w = window as any;
    const overspeed = isSpeeding;
    marker.setIcon({
      path: w.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillOpacity: 1,
      fillColor: overspeed ? "#ef4444" : "#22c55e",
      strokeColor: "white",
      strokeWeight: 3,
    });
  }, [latitude, longitude, isSpeeding, userDragged]);

  // 3) Every 5 seconds: fetch new route points, snap to road, draw polyline
  useEffect(() => {
    if (!sessionId || !mapsLoaded || !polylineRef.current) return;

    let cancelled = false;

    // Reset on session change
    rawPointsRef.current = [];
    lastFetchedAtRef.current = null;

    async function tick() {
      try {
        setNote(null);

        let query = supabase
          .from("telematics_gps_points")
          .select("latitude,longitude,recorded_at")
          .eq("telematics_id", sessionId)
          .order("recorded_at", { ascending: true })
          .limit(250);

        const lastFetchedAt = lastFetchedAtRef.current;
        if (lastFetchedAt) query = query.gt("recorded_at", lastFetchedAt);

        const { data, error } = await query;
        if (cancelled) return;
        if (error) throw error;

        const newPts = ((data as PointRow[]) || [])
          .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
          .map((p) => ({ lat: p.latitude, lng: p.longitude, t: p.recorded_at }));

        if (newPts.length) {
          lastFetchedAtRef.current = newPts[newPts.length - 1].t;
          rawPointsRef.current = [...rawPointsRef.current, ...newPts].slice(-300);
        }

        if (rawPointsRef.current.length < 2) return;

        // Keep last ~120 points, sample to reduce request size
        const recent = rawPointsRef.current.slice(-120);
        const sampled = recent.filter((_, idx) => idx % 2 === 0).slice(-100);

        // Try snap-to-road; if it fails, draw straight line
        let line: Array<{ lat: number; lng: number }>;
        try {
          line = await callSnapToRoad(sampled.map((p) => ({ lat: p.lat, lng: p.lng })));
          if (!line.length) line = sampled.map((p) => ({ lat: p.lat, lng: p.lng }));
        } catch {
          line = sampled.map((p) => ({ lat: p.lat, lng: p.lng }));
          setNote("Road-snapping not available yet (showing straight line).");
        }

        if (cancelled) return;

        const w = window as any;
        polylineRef.current.setPath(line.map((p) => new w.google.maps.LatLng(p.lat, p.lng)));
      } catch (e: any) {
        if (!cancelled) setNote(e?.message ?? "Route update failed");
      }
    }

    tick();
    const timer = window.setInterval(tick, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId, mapsLoaded]);

  // Re-center handler
  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapRef.current && latitude != null && longitude != null) {
      mapRef.current.setView?.({ lat: latitude, lng: longitude });
      mapRef.current.panTo?.({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* Re-center button */}
      {userDragged && latitude != null && longitude != null && (
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

      {/* Speed display panel — same design as existing LiveTrackingMap */}
      {sessionId && (isConnected || latitude !== null) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className={`backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border ${
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

              <div className="w-12 h-12 shrink-0 rounded-full bg-background border-4 flex items-center justify-center border-destructive">
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

      {/* Note banner */}
      {note && (
        <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border max-w-xs">
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      )}

      {/* Loading state */}
      {!mapsLoaded && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-foreground font-medium">{status}</p>
        </div>
      )}
    </div>
  );
}
