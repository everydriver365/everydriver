import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crosshair, Compass, Navigation } from "lucide-react";
import { loadGoogleMaps, fetchGoogleMapsKey, callSnapToRoad } from "@/lib/googleMapsLoader";
import { darkMapStyle } from "@/lib/googleMapsDarkStyle";
import { useTheme } from "@/context/ThemeContext";
import SpeedLimitRoundel from "@/components/instructor/SpeedLimitRoundel";

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

const CONNECTION_THRESHOLD_SECONDS = 30;

// Speed-based zoom: fast = zoomed out, slow = zoomed in
function getTargetZoom(speedMph: number): number {
  if (speedMph > 50) return 14;
  if (speedMph > 30) return 15;
  if (speedMph > 10) return 16;
  return 17;
}

// ========== Component ==========
export default function LiveGoogleTrackingMap({ className = "", deviceId: deviceIdProp }: { className?: string; deviceId?: string }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const tailPolylineRef = useRef<any>(null);
  const speedOverlayRef = useRef<any>(null);

  const [device, setDevice] = useState<DeviceRow | null>(null);
  const [status, setStatus] = useState("Connecting…");
  const [unit, setUnit] = useState<"mph" | "kmh">("mph");
  const [note, setNote] = useState<string | null>(null);
  const [userDragged, setUserDragged] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [trackUp, setTrackUp] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || resolvedTheme === "oled";

  const rawPointsRef = useRef<Array<{ lat: number; lng: number; t: string }>>([]);
  const lastFetchedAtRef = useRef<string | null>(null);
  const lastZoomRef = useRef<number>(16);
  const zoomDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derive connection state
  const lastSeenMs = device?.last_seen_at ? new Date(device.last_seen_at).getTime() : 0;
  const ageSeconds = lastSeenMs ? (now - lastSeenMs) / 1000 : Infinity;
  const isConnected = ageSeconds <= CONNECTION_THRESHOLD_SECONDS;

  const overspeed = useMemo(() => {
    if (!isConnected) return false;
    const s = device?.last_speed_kmh ?? null;
    const lim = device?.last_speed_limit_kmh ?? null;
    if (s == null || lim == null) return false;
    return s > lim + 2;
  }, [isConnected, device?.last_speed_kmh, device?.last_speed_limit_kmh]);

  const currentSpeedMph = useMemo(() => {
    if (!isConnected) return 0;
    const s = device?.last_speed_kmh ?? null;
    if (s == null) return 0;
    return Math.round(kmhToMph(s));
  }, [isConnected, device?.last_speed_kmh]);

  const speedText = useMemo(() => {
    if (!isConnected) return "—";
    const s = device?.last_speed_kmh ?? null;
    if (s == null) return "—";
    return unit === "mph" ? `${Math.round(kmhToMph(s))}` : `${Math.round(s)}`;
  }, [isConnected, device?.last_speed_kmh, unit]);

  const speedUnit = unit === "mph" ? "mph" : "km/h";

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
      if (!auth?.user) { setStatus("Please log in to see tracking."); return; }
      let query = supabase
        .from("gps_devices")
        .select("id,is_active,last_latitude,last_longitude,last_heading,last_speed_kmh,last_speed_limit_kmh,last_road_name,last_seen_at,current_session_id");
      
      if (deviceIdProp) {
        query = query.eq("id", deviceIdProp);
      } else {
        query = query.eq("is_active", true).order("last_seen_at", { ascending: false }).limit(1);
      }
      
      const { data, error } = await query.maybeSingle();
      if (cancelled) return;
      if (error) { setStatus(`Could not load tracker: ${error.message}`); return; }
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
        if (!apiKey) { setStatus("Google Maps API key not configured"); return; }
        if (cancelled) return;
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const w = window as any;
        const center = device?.last_latitude != null && device?.last_longitude != null
          ? { lat: device.last_latitude, lng: device.last_longitude }
          : { lat: 51.5072, lng: -0.1276 };

        const map = new w.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: isDark ? darkMapStyle : [],
        });

        mapRef.current = map;

        markerRef.current = new w.google.maps.Marker({
          position: center,
          map,
          title: "Live position",
        });

        polylineRef.current = new w.google.maps.Polyline({
          map, path: [], geodesic: true, strokeColor: "#3b82f6", strokeOpacity: 0.9, strokeWeight: 5,
        });

        tailPolylineRef.current = new w.google.maps.Polyline({
          map, path: [], geodesic: true, strokeColor: "#3b82f6", strokeOpacity: 0.6, strokeWeight: 4,
        });

        // Speed badge overlay
        class SpeedBadgeOverlay extends w.google.maps.OverlayView {
          private div: HTMLDivElement | null = null;
          private position: any = null;
          private text: string = "";
          private color: string = "#22c55e";
          private visible: boolean = true;

          constructor(map: any, pos: any) {
            super();
            this.position = pos;
            this.setMap(map);
          }

          onAdd() {
            this.div = document.createElement("div");
            Object.assign(this.div.style, {
              position: "absolute",
              whiteSpace: "nowrap",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "12px",
              fontWeight: "700",
              color: "#fff",
              padding: "3px 8px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              pointerEvents: "none",
              transition: "background-color 0.3s ease",
              transform: "translate(-50%, -100%)",
            });
            const panes = this.getPanes();
            panes?.overlayLayer?.appendChild(this.div);
          }

          draw() {
            if (!this.div || !this.position) return;
            const proj = this.getProjection();
            if (!proj) return;
            const point = proj.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = `${point.x}px`;
              this.div.style.top = `${point.y - 24}px`;
            }
          }

          onRemove() {
            this.div?.parentNode?.removeChild(this.div);
            this.div = null;
          }

          update(pos: any, text: string, color: string, vis: boolean) {
            this.position = pos;
            this.text = text;
            this.color = color;
            this.visible = vis;
            if (this.div) {
              this.div.textContent = text;
              this.div.style.backgroundColor = color;
              this.div.style.display = vis ? "block" : "none";
            }
            this.draw();
          }
        }

        const overlay = new SpeedBadgeOverlay(map, new w.google.maps.LatLng(center.lat, center.lng));
        speedOverlayRef.current = overlay;

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

  // Apply dark/light style when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({ styles: isDark ? darkMapStyle : [] });
  }, [isDark]);

  // 3) Update marker + overlay + track-up + auto-zoom
  const lastAppendedRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const lat = device?.last_latitude;
    const lng = device?.last_longitude;
    if (lat == null || lng == null) return;

    const w = window as any;
    const pos = new w.google.maps.LatLng(lat, lng);
    marker.setPosition(pos);

    // Track-up mode: rotate map to heading
    if (trackUp) {
      map.setHeading(device?.last_heading ?? 0);
      map.setTilt(45);
    }

    if (!userDragged) {
      map.panTo(pos);

      // Auto-zoom based on speed (debounced)
      const targetZoom = getTargetZoom(currentSpeedMph);
      if (targetZoom !== lastZoomRef.current) {
        if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
        zoomDebounceRef.current = setTimeout(() => {
          map.setZoom(targetZoom);
          lastZoomRef.current = targetZoom;
        }, 2000);
      }
    }

    marker.setIcon({
      path: w.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      rotation: device?.last_heading ?? 0,
      fillOpacity: 1,
      fillColor: markerColor,
      strokeColor: "white",
      strokeWeight: 3,
    });

    // Update speed badge overlay
    if (speedOverlayRef.current) {
      const badgeText = speedText !== "—" ? `${speedText} ${speedUnit}` : "";
      speedOverlayRef.current.update(pos, badgeText, markerColor, speedText !== "—");
    }

    // Append to tail polyline
    if (tailPolylineRef.current) {
      const prev = lastAppendedRef.current;
      const dLat = prev ? Math.abs(prev.lat - lat) : Infinity;
      const dLng = prev ? Math.abs(prev.lng - lng) : Infinity;
      const approxMeters = Math.max(dLat, dLng) * 111_000;
      const shouldAppend = approxMeters > 5 && approxMeters < 500;
      if (!prev || shouldAppend) {
        tailPolylineRef.current.getPath().push(new w.google.maps.LatLng(lat, lng));
        lastAppendedRef.current = { lat, lng };
      }
    }
  }, [device?.last_latitude, device?.last_longitude, device?.last_heading, markerColor, userDragged, trackUp, currentSpeedMph, speedText, speedUnit]);

  // 4) Subscribe to realtime updates
  useEffect(() => {
    if (!device?.id) return;
    const channel = supabase
      .channel(`gps_device_live_${device.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gps_devices", filter: `id=eq.${device.id}` },
        (payload) => { setDevice((prev) => ({ ...(prev ?? ({} as any)), ...(payload.new as any) })); setStatus("Live"); }
      )
      .subscribe((s) => { if (s === "SUBSCRIBED") setStatus("Live"); });
    return () => { supabase.removeChannel(channel); };
  }, [device?.id]);

  // 5) Realtime trail: initial fetch + subscribe to new GPS points
  const snapDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const needsSnapRef = useRef(false);

  const redrawPolyline = useCallback(async () => {
    if (!polylineRef.current || rawPointsRef.current.length < 2) return;
    const recent = rawPointsRef.current.slice(-120);
    const sampled = recent.filter((_, idx) => idx % 2 === 0).slice(-100);
    let line: Array<{ lat: number; lng: number }>;
    try {
      line = await callSnapToRoad(sampled.map((p) => ({ lat: p.lat, lng: p.lng })));
      if (!line.length) line = sampled.map((p) => ({ lat: p.lat, lng: p.lng }));
      setNote(null);
    } catch {
      line = sampled.map((p) => ({ lat: p.lat, lng: p.lng }));
      setNote("Road-snapping not available yet (showing straight line).");
    }
    const w = window as any;
    polylineRef.current.setPath(line.map((p) => new w.google.maps.LatLng(p.lat, p.lng)));
    if (tailPolylineRef.current) {
      tailPolylineRef.current.setPath([]);
      if (line.length > 0) {
        const lastSnapped = line[line.length - 1];
        tailPolylineRef.current.getPath().push(new w.google.maps.LatLng(lastSnapped.lat, lastSnapped.lng));
        lastAppendedRef.current = { lat: lastSnapped.lat, lng: lastSnapped.lng };
      }
    }
    needsSnapRef.current = false;
  }, []);

  const scheduleSnap = useCallback(() => {
    needsSnapRef.current = true;
    if (snapDebounceRef.current) clearTimeout(snapDebounceRef.current);
    snapDebounceRef.current = setTimeout(() => { redrawPolyline(); }, 1500);
  }, [redrawPolyline]);

  useEffect(() => {
    if (!device?.current_session_id || !mapsLoaded || !polylineRef.current) return;
    let cancelled = false;
    rawPointsRef.current = [];
    lastFetchedAtRef.current = null;

    // Initial fetch of existing trail
    async function initialFetch() {
      try {
        const { data, error } = await supabase.from("telematics_gps_points")
          .select("latitude,longitude,recorded_at")
          .eq("telematics_id", device!.current_session_id!)
          .order("recorded_at", { ascending: true }).limit(300);
        if (cancelled || error) return;
        const pts = ((data as PointRow[]) || [])
          .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
          .map((p) => ({ lat: p.latitude, lng: p.longitude, t: p.recorded_at }));
        if (pts.length) {
          rawPointsRef.current = pts.slice(-300);
          lastFetchedAtRef.current = pts[pts.length - 1].t;
          redrawPolyline();
        }
      } catch {}
    }
    initialFetch();

    // Realtime subscription for new points
    const channel = supabase
      .channel(`trail_${device!.current_session_id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "telematics_gps_points",
        filter: `telematics_id=eq.${device!.current_session_id}`,
      }, (payload) => {
        const p = payload.new as any;
        if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) return;
        const newPt = { lat: p.latitude, lng: p.longitude, t: p.recorded_at };
        rawPointsRef.current = [...rawPointsRef.current, newPt].slice(-300);
        lastFetchedAtRef.current = newPt.t;
        scheduleSnap();
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          // Fallback: poll every 5s if realtime fails
          console.warn("[Trail] Realtime channel error, falling back to polling");
          const fallback = setInterval(async () => {
            let query = supabase.from("telematics_gps_points").select("latitude,longitude,recorded_at")
              .eq("telematics_id", device!.current_session_id!).order("recorded_at", { ascending: true }).limit(250);
            if (lastFetchedAtRef.current) query = query.gt("recorded_at", lastFetchedAtRef.current);
            const { data } = await query;
            const newPts = ((data as PointRow[]) || [])
              .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
              .map((p) => ({ lat: p.latitude, lng: p.longitude, t: p.recorded_at }));
            if (newPts.length) {
              lastFetchedAtRef.current = newPts[newPts.length - 1].t;
              rawPointsRef.current = [...rawPointsRef.current, ...newPts].slice(-300);
              redrawPolyline();
            }
          }, 5000);
          // Store for cleanup
          (channel as any)._fallbackTimer = fallback;
        }
      });

    return () => {
      cancelled = true;
      if (snapDebounceRef.current) clearTimeout(snapDebounceRef.current);
      const fb = (channel as any)._fallbackTimer;
      if (fb) clearInterval(fb);
      supabase.removeChannel(channel);
    };
  }, [device?.current_session_id, mapsLoaded, redrawPolyline, scheduleSnap]);

  // 5b) Trigger poller every 3s (fast mode = position-only for low latency)
  useEffect(() => {
    if (!device?.id || !isConnected) return;
    const triggerPoller = async () => {
      try { await supabase.functions.invoke("geotab-poller", { body: { mode: "fast" } }); }
      catch (err) { console.error("Live map poller trigger failed:", err); }
    };
    triggerPoller();
    const timer = setInterval(triggerPoller, 3000);
    return () => clearInterval(timer);
  }, [device?.id, isConnected]);

  // Auto-follow reset after 10s
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userDragged) { if (dragTimerRef.current) clearTimeout(dragTimerRef.current); return; }
    dragTimerRef.current = setTimeout(() => setUserDragged(false), 10000);
    return () => { if (dragTimerRef.current) clearTimeout(dragTimerRef.current); };
  }, [userDragged]);

  // Wake Lock
  useEffect(() => {
    let wakeLock: any = null;
    let released = false;
    async function acquire() {
      try { if ("wakeLock" in navigator && !released) { wakeLock = await (navigator as any).wakeLock.request("screen"); } } catch {}
    }
    acquire();
    const onVisChange = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVisChange);
    return () => { released = true; document.removeEventListener("visibilitychange", onVisChange); wakeLock?.release?.().catch(() => {}); };
  }, []);

  // Track-up toggle handler
  const handleToggleTrackUp = useCallback(() => {
    setTrackUp((prev) => {
      const next = !prev;
      if (!next && mapRef.current) {
        mapRef.current.setHeading(0);
        mapRef.current.setTilt(0);
      }
      return next;
    });
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
          <h2 className="text-sm font-semibold text-foreground bg-background/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-md border">
            Live Tracking
          </h2>
          <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
            {connectionLabel}
          </Badge>
          {overspeed && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              Overspeed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Track-Up toggle */}
          <Button
            variant={trackUp ? "default" : "secondary"}
            size="sm"
            className="shadow-lg"
            onClick={handleToggleTrackUp}
            title={trackUp ? "Switch to North-Up" : "Switch to Track-Up"}
          >
            {trackUp ? <Navigation className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
          </Button>

          {userDragged && device?.last_latitude != null && device?.last_longitude != null && (
            <Button variant="secondary" size="sm" className="shadow-lg" onClick={handleRecenter}>
              <Crosshair className="h-4 w-4 mr-1" />
              Center
            </Button>
          )}
          <button
            onClick={() => setUnit((u) => (u === "mph" ? "kmh" : "mph"))}
            className="px-2.5 py-1.5 rounded-2xl border bg-background/90 backdrop-blur-sm shadow-md text-xs font-medium cursor-pointer hover:bg-muted transition-colors"
          >
            {unit.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Road name banner */}
      {device?.last_road_name && isConnected && (
        <div className="absolute top-16 left-4 right-4 z-20">
          <div className="bg-background/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md border text-center">
            <p className="text-sm font-semibold text-foreground truncate">{device.last_road_name}</p>
          </div>
        </div>
      )}

      {/* Sat-nav bottom panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <Card className="backdrop-blur-sm bg-background/95 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Speed hero */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <p
                    className="font-bold tabular-nums leading-none"
                    style={{
                      fontSize: "3rem",
                      color: markerColor,
                    }}
                  >
                    {speedText}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{speedUnit}</p>
                </div>

                {/* Speed limit roundel */}
                <SpeedLimitRoundel
                  speedLimit={device?.last_speed_limit_kmh ?? null}
                  isExceeding={overspeed}
                  size="md"
                />
              </div>

              {/* Divider */}
              <div className="w-px h-14 bg-border flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {connectionLabel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Updated</span>
                  <span className="text-xs font-medium text-foreground">{agoText}</span>
                </div>
                {trackUp && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Heading</span>
                    <span className="text-xs font-medium text-foreground">{device?.last_heading != null ? `${Math.round(device.last_heading)}°` : "—"}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note banner */}
      {note && (
        <div className="absolute top-[6.5rem] left-4 z-20 bg-background/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-md border max-w-xs">
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
