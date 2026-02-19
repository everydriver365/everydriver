import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crosshair } from "lucide-react";
import { loadGoogleMaps, fetchGoogleMapsKey, callSnapToRoad } from "@/lib/googleMapsLoader";

// ========== Types ==========
type DeviceRow = {
  id: string;
  is_active: boolean;
  last_latitude: number | null;
  last_longitude: number | null;
  last_heading: number | null;
  last_speed_kmh: number | null;
  last_speed_limit_kmh: number | null;
  last_road_name: string | null;
  last_seen_at: string | null;
  current_session_id: string | null;
};

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

// ========== InfoCard ==========
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}

const CONNECTION_THRESHOLD_SECONDS = 30;

// ========== Component ==========
export default function LiveGoogleTrackingMap({ className = "" }: { className?: string }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);      // snapped route (updated every 5s)
  const tailPolylineRef = useRef<any>(null);  // raw tail (updated instantly, cleared after snap)

  const [device, setDevice] = useState<DeviceRow | null>(null);
  const [status, setStatus] = useState("Connecting…");
  const [unit, setUnit] = useState<"mph" | "kmh">("mph");
  const [note, setNote] = useState<string | null>(null);
  const [userDragged, setUserDragged] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Rolling raw points for route
  const rawPointsRef = useRef<Array<{ lat: number; lng: number; t: string }>>([]);
  const lastFetchedAtRef = useRef<string | null>(null);

  // Tick every 1 second so connection state auto-updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derive connection state from `now` and device
  const lastSeenMs = device?.last_seen_at
    ? new Date(device.last_seen_at).getTime()
    : 0;
  const ageSeconds = lastSeenMs ? (now - lastSeenMs) / 1000 : Infinity;
  const isConnected = ageSeconds <= CONNECTION_THRESHOLD_SECONDS;

  // Safe speed display: blank when offline
  const overspeed = useMemo(() => {
    if (!isConnected) return false;
    const s = device?.last_speed_kmh ?? null;
    const lim = device?.last_speed_limit_kmh ?? null;
    if (s == null || lim == null) return false;
    return s > lim + 2;
  }, [isConnected, device?.last_speed_kmh, device?.last_speed_limit_kmh]);

  const speedText = useMemo(() => {
    if (!isConnected) return "—";
    const s = device?.last_speed_kmh ?? null;
    if (s == null) return "—";
    return unit === "mph" ? `${Math.round(kmhToMph(s))} mph` : `${Math.round(s)} km/h`;
  }, [isConnected, device?.last_speed_kmh, unit]);

  const limitText = useMemo(() => {
    if (!isConnected) return "—";
    const s = device?.last_speed_limit_kmh ?? null;
    if (s == null) return "—";
    return unit === "mph" ? `${Math.round(kmhToMph(s))} mph` : `${Math.round(s)} km/h`;
  }, [isConnected, device?.last_speed_limit_kmh, unit]);

  const markerColor = !isConnected
    ? "#9ca3af"
    : overspeed
    ? "#ef4444"
    : "#22c55e";

  const connectionLabel = isConnected ? "Connected" : "Offline";

  const agoText = lastSeenMs > 0
    ? ageSeconds < 60
      ? `${Math.floor(ageSeconds)}s ago`
      : ageSeconds < 3600
      ? `${Math.floor(ageSeconds / 60)}m ago`
      : `${Math.floor(ageSeconds / 3600)}h ago`
    : "—";

  // 1) Load user's active device row
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("Loading your tracker…");
      setNote(null);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setStatus("Please log in to see tracking.");
        return;
      }

      const { data, error } = await supabase
        .from("gps_devices")
        .select(
          "id,is_active,last_latitude,last_longitude,last_heading,last_speed_kmh,last_speed_limit_kmh,last_road_name,last_seen_at,current_session_id"
        )
        .eq("is_active", true)
        .single();

      if (cancelled) return;

      if (error) {
        setStatus(`Could not load tracker: ${error.message}`);
        return;
      }

      setDevice(data as DeviceRow);
      setStatus("Live");
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // 2) Init Google Map once
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
          device?.last_latitude != null && device?.last_longitude != null
            ? { lat: device.last_latitude, lng: device.last_longitude }
            : { lat: 51.5072, lng: -0.1276 };

        const map = new w.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 16,
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

        tailPolylineRef.current = new w.google.maps.Polyline({
          map,
          path: [],
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 4,
        });

    map.addListener("dragstart", () => setUserDragged(true));
    map.addListener("mousedown", () => setUserDragged(true));

    setMapsLoaded(true);
        setStatus("Live");
      } catch (e: any) {
        if (!cancelled) setStatus(e?.message ?? "Map init failed");
      }
    }

    init();
    return () => { cancelled = true; };
  }, [device?.last_latitude, device?.last_longitude]);

  // 3) Update marker + extend polyline instantly whenever device changes
  const lastAppendedRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const lat = device?.last_latitude;
    const lng = device?.last_longitude;
    if (lat == null || lng == null) return;

    const pos = { lat, lng };
    marker.setPosition(pos);

    if (!userDragged) {
      map.panTo(pos);
    }

    const w = window as any;
    marker.setIcon({
      path: w.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      rotation: device?.last_heading ?? 0,
      fillOpacity: 1,
      fillColor: markerColor,
      strokeColor: "white",
      strokeWeight: 3,
    });

    // Append to the TAIL polyline only (never the main snapped one)
    if (tailPolylineRef.current) {
      const prev = lastAppendedRef.current;
      const dLat = prev ? Math.abs(prev.lat - lat) : Infinity;
      const dLng = prev ? Math.abs(prev.lng - lng) : Infinity;
      const approxMeters = Math.max(dLat, dLng) * 111_000;
      // Skip jitter (<5m) and erroneous jumps (>500m)
      const shouldAppend = approxMeters > 5 && approxMeters < 500;
      if (!prev || shouldAppend) {
        tailPolylineRef.current.getPath().push(new w.google.maps.LatLng(lat, lng));
        lastAppendedRef.current = { lat, lng };
      }
    }
  }, [device?.last_latitude, device?.last_longitude, device?.last_heading, markerColor, userDragged]);

  // 4) Subscribe to realtime updates for this device row
  useEffect(() => {
    if (!device?.id) return;

    const channel = supabase
      .channel(`gps_device_live_${device.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gps_devices", filter: `id=eq.${device.id}` },
        (payload) => {
          setDevice((prev) => ({ ...(prev ?? ({} as any)), ...(payload.new as any) }));
          setStatus("Live");
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("Live");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [device?.id]);

  // 5) Every 5 seconds: fetch new route points, snap to road, draw polyline
  useEffect(() => {
    if (!device?.current_session_id || !mapsLoaded || !polylineRef.current) return;

    let cancelled = false;

    rawPointsRef.current = [];
    lastFetchedAtRef.current = null;

    async function tick() {
      try {
        setNote(null);

        let query = supabase
          .from("telematics_gps_points")
          .select("latitude,longitude,recorded_at")
          .eq("telematics_id", device!.current_session_id!)
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

        const recent = rawPointsRef.current.slice(-120);
        const sampled = recent.filter((_, idx) => idx % 2 === 0).slice(-100);

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

        // Clear the tail and reset its start to the last snapped point
        if (tailPolylineRef.current) {
          tailPolylineRef.current.setPath([]);
          if (line.length > 0) {
            const lastSnapped = line[line.length - 1];
            tailPolylineRef.current.getPath().push(new w.google.maps.LatLng(lastSnapped.lat, lastSnapped.lng));
            lastAppendedRef.current = { lat: lastSnapped.lat, lng: lastSnapped.lng };
          }
        }
      } catch (e: any) {
        if (!cancelled) setNote(e?.message ?? "Route update failed");
      }
    }

    tick();
    const timer = window.setInterval(tick, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [device?.current_session_id, mapsLoaded]);

  // 5b) Trigger geotab-poller every 10s while map is open and device is active
  useEffect(() => {
    if (!device?.id || !isConnected) return;

    const triggerPoller = async () => {
      try {
        await supabase.functions.invoke("geotab-poller", { method: "POST" });
      } catch (err) {
        console.error("Live map poller trigger failed:", err);
      }
    };

    triggerPoller();
    const timer = setInterval(triggerPoller, 10000);
    return () => clearInterval(timer);
  }, [device?.id, isConnected]);

  // Auto-follow reset: resume following 10s after user drags
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userDragged) {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
      return;
    }
    dragTimerRef.current = setTimeout(() => setUserDragged(false), 10000);
    return () => { if (dragTimerRef.current) clearTimeout(dragTimerRef.current); };
  }, [userDragged]);

  // Wake Lock: keep screen on while map is visible
  useEffect(() => {
    let wakeLock: any = null;
    let released = false;

    async function acquire() {
      try {
        if ("wakeLock" in navigator && !released) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* non-critical */ }
    }

    acquire();

    const onVisChange = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisChange);
      wakeLock?.release?.().catch(() => {});
    };
  }, []);

  // Re-center handler
  const handleRecenter = useCallback(() => {
    setUserDragged(false);
    if (mapRef.current && device?.last_latitude != null && device?.last_longitude != null) {
      mapRef.current.panTo({ lat: device.last_latitude, lng: device.last_longitude });
    }
  }, [device?.last_latitude, device?.last_longitude]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* Header bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border">
            Live Tracking
          </h2>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="text-xs"
          >
            {connectionLabel}
          </Badge>
          {overspeed && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              Overspeed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userDragged && device?.last_latitude != null && device?.last_longitude != null && (
            <Button
              variant="secondary"
              size="sm"
              className="shadow-lg"
              onClick={handleRecenter}
            >
              <Crosshair className="h-4 w-4 mr-1" />
              Center
            </Button>
          )}
          <button
            onClick={() => setUnit((u) => (u === "mph" ? "kmh" : "mph"))}
            className="px-2.5 py-1.5 rounded-lg border bg-background/90 backdrop-blur-sm shadow-md text-xs font-medium cursor-pointer hover:bg-muted transition-colors"
          >
            {unit.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Info cards at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <Card className="backdrop-blur-sm bg-background/95 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <InfoCard label="Speed" value={speedText} />
              <InfoCard label="Limit" value={limitText} />
              <InfoCard label="Road" value={device?.last_road_name || "—"} />
              <InfoCard label="Updated" value={agoText} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note banner */}
      {note && (
        <div className="absolute top-16 left-4 z-20 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border max-w-xs">
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
