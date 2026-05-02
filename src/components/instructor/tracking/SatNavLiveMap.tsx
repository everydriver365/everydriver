import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { fetchGoogleMapsKey, loadGoogleMaps, callSnapToRoad } from "@/lib/googleMapsLoader";
import { supabase } from "@/integrations/supabase/client";

interface SatNavLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  speedLimitKmh: number | null;
  roadName: string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  sessionId?: string | null;
  ignitionOn?: boolean | null;
  dailyDistanceKm?: number | null;
  /** When true, fills parent container instead of using fixed height */
  fullscreen?: boolean;
  className?: string;
}

export function SatNavLiveMap({
  latitude, longitude, heading, speedKmh, speedLimitKmh, roadName,
  lastSeenAt, isActive, sessionId, ignitionOn, dailyDistanceKm,
  fullscreen = false, className = "",
}: SatNavLiveMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const polylineCasingRef = useRef<google.maps.Polyline | null>(null);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const trailLoadedRef = useRef<string | null>(null);

  // Follow mode — when true (default), camera tracks the vehicle in fullscreen.
  // User drag/zoom turns it off and surfaces a "Re-centre" button.
  const [followMode, setFollowMode] = useState(true);
  const followModeRef = useRef<boolean>(true);
  followModeRef.current = followMode;
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const suppressFollowOffRef = useRef<boolean>(false);

  // Smoothing/interpolation refs
  const animRef = useRef<number | null>(null);
  const fromPosRef = useRef<{ lat: number; lng: number; heading: number; t: number } | null>(null);
  const targetPosRef = useRef<{ lat: number; lng: number; heading: number; t: number } | null>(null);
  const fixGapsRef = useRef<number[]>([]);
  const lastFixTsRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(isActive);
  const fullscreenRef = useRef<boolean>(fullscreen);
  isActiveRef.current = isActive;
  fullscreenRef.current = fullscreen;

  // Snap-to-Roads refs
  const snappedPathRef = useRef<google.maps.LatLng[]>([]); // road-aligned trail
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapInFlightRef = useRef<boolean>(false);
  const snapDirtyRef = useRef<boolean>(false);
  const [snapStatus, setSnapStatus] = useState<"idle" | "syncing" | "snapped" | "raw">("idle");
  const [lastFixLabel, setLastFixLabel] = useState<string | null>(null);
  const [lastFixAgeSec, setLastFixAgeSec] = useState<number | null>(null);

  // Render whichever path is freshest (snapped if available, else raw) into both polylines
  const renderPolylines = useCallback(() => {
    const display = snappedPathRef.current.length >= 2
      ? snappedPathRef.current
      : pathRef.current;
    polylineRef.current?.setPath(display);
    polylineCasingRef.current?.setPath(display);
  }, []);

  // Debounced Snap-to-Roads call — aligns the trail to actual road geometry
  const requestSnap = useCallback(() => {
    snapDirtyRef.current = true;
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(async () => {
      if (snapInFlightRef.current) {
        // Re-arm — another call already running, retry shortly after it finishes
        snapTimerRef.current = setTimeout(() => requestSnap(), 1200);
        return;
      }
      const raw = pathRef.current;
      if (raw.length < 2) return;
      // Snap-to-Roads accepts max 100 points per call — use trailing window
      const window = raw.slice(-100).map((p) => ({ lat: p.lat(), lng: p.lng() }));
      snapInFlightRef.current = true;
      snapDirtyRef.current = false;
      setSnapStatus("syncing");
      try {
        const snapped = await callSnapToRoad(window);
        if (snapped && snapped.length >= 2) {
          // If we used a trailing window, prepend the older raw points so the
          // entire historic trail still renders (older portion stays as raw).
          const headCount = Math.max(0, raw.length - window.length);
          const head = headCount > 0 ? raw.slice(0, headCount) : [];
          snappedPathRef.current = [
            ...head,
            ...snapped.map((p) => new google.maps.LatLng(p.lat, p.lng)),
          ];
          renderPolylines();
          setSnapStatus("snapped");
        } else {
          setSnapStatus("raw");
        }
      } catch (err) {
        console.warn("[SatNavLiveMap] snap-to-road failed, falling back to raw:", err);
        setSnapStatus("raw");
      } finally {
        snapInFlightRef.current = false;
        // If new fixes arrived during the request, schedule another pass
        if (snapDirtyRef.current) {
          snapTimerRef.current = setTimeout(() => requestSnap(), 800);
        }
      }
    }, 1200); // wait 1.2s after the last fix before snapping
  }, [renderPolylines]);

  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;
  const hasPosition = latitude !== null && longitude !== null;

  // Tick the "last fix" label every second so the indicator stays accurate
  useEffect(() => {
    if (!lastSeenAt) { setLastFixLabel(null); setLastFixAgeSec(null); return; }
    const update = () => {
      const ageSec = Math.max(0, Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 1000));
      setLastFixAgeSec(ageSec);
      if (ageSec < 60) setLastFixLabel(`${ageSec}s ago`);
      else if (ageSec < 3600) setLastFixLabel(`${Math.round(ageSec / 60)}m ago`);
      else setLastFixLabel(`${Math.round(ageSec / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastSeenAt]);

  // Premium signal status — derived from lastFix age, drives the pill UI
  type SignalStatus = "waiting" | "live" | "delayed" | "weak" | "lost";
  const signalStatus: SignalStatus =
    lastFixAgeSec == null ? "waiting"
    : lastFixAgeSec < 15 ? "live"
    : lastFixAgeSec < 30 ? "delayed"
    : lastFixAgeSec < 90 ? "weak"
    : "lost";

  const speedMph = speedKmh != null ? Math.round(speedKmh * 0.621371) : null;
  const speedLimitMph = speedLimitKmh != null ? Math.round(speedLimitKmh * 0.621371) : null;
  const isOverSpeed = speedKmh != null && speedLimitKmh != null && speedKmh > speedLimitKmh;
  const dailyMiles = dailyDistanceKm != null ? Math.round(dailyDistanceKm * 0.621371) : null;

  // Load Google Maps SDK
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key || cancelled) { if (!cancelled) setMapError(true); return; }
        await loadGoogleMaps(key);
        if (!cancelled) { setReady(true); setMapError(false); }
      } catch (e) {
        console.error("Failed to load Google Maps for SatNavLiveMap:", e);
        if (!cancelled) setMapError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Wake lock for fullscreen mode
  useEffect(() => {
    if (!fullscreen) return;
    let wakeLock: any = null;
    let released = false;
    async function acquire() {
      try { if ("wakeLock" in navigator && !released) { wakeLock = await (navigator as any).wakeLock.request("screen"); } } catch {}
    }
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { released = true; document.removeEventListener("visibilitychange", onVis); wakeLock?.release?.().catch(() => {}); };
  }, [fullscreen]);

  const getArrowIcon = useCallback((rotation: number, active: boolean): google.maps.Symbol => ({
    path: "M 0,-12 L -7,11 L 0,6 L 7,11 Z",
    fillColor: active ? "#2563eb" : "#9ca3af",
    fillOpacity: 1,
    strokeColor: "white",
    strokeWeight: 3,
    scale: fullscreenRef.current ? 2.4 : 2.2,
    rotation,
    anchor: new google.maps.Point(0, 0),
  }), []);

  // Append a point to the trail polyline, suppressing near-duplicate fixes
  // (~0.5m at UK latitudes). Returns true if the point was actually added so
  // callers can decide whether to re-render / re-snap.
  const appendTrailPoint = useCallback((lat: number, lng: number): boolean => {
    const last = pathRef.current[pathRef.current.length - 1];
    if (
      last &&
      Math.abs(last.lat() - lat) < 0.000005 &&
      Math.abs(last.lng() - lng) < 0.000005
    ) {
      return false;
    }
    pathRef.current.push(new google.maps.LatLng(lat, lng));
    return true;
  }, []);

  // Init map once SDK is ready
  useEffect(() => {
    if (!ready || !mapDivRef.current || mapRef.current) return;

    const center = hasPosition
      ? { lat: latitude!, lng: longitude! }
      : { lat: 54.5, lng: -3.5 };

    // Decluttering nav-style — hide POI/transit clutter, keep roads + key labels
    const navStyles: google.maps.MapTypeStyle[] = [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "poi.business", stylers: [{ visibility: "off" }] },
      { featureType: "poi.attraction", elementType: "labels", stylers: [{ visibility: "simplified" }] },
      { featureType: "poi.school", elementType: "labels", stylers: [{ visibility: "on" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "transit.station", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
      { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    ];

    const map = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: fullscreen ? 18.5 : 17,
      tilt: fullscreen ? 30 : 0,
      heading: heading ?? 0,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      mapTypeId: "roadmap",
      clickableIcons: false,
      keyboardShortcuts: false,
      styles: navStyles,
      // Note: no mapId — required so inline `styles` above are honoured
    });

    mapRef.current = map;

    // Two-tone route polyline (Waze/Google nav style)
    polylineCasingRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#1e3a8a",
      strokeOpacity: 0.9,
      strokeWeight: 9,
      zIndex: 1,
    });
    polylineRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#3b82f6",
      strokeOpacity: 1,
      strokeWeight: 6,
      zIndex: 2,
    });

    if (hasPosition) {
      const pos = new google.maps.LatLng(latitude!, longitude!);
      pathRef.current = [pos];
      polylineRef.current.setPath(pathRef.current);
      polylineCasingRef.current.setPath(pathRef.current);

      markerRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: getArrowIcon(heading ?? 0, isActive),
        zIndex: 999,
      });
    }

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      polylineCasingRef.current?.setMap(null);
      polylineCasingRef.current = null;
      pathRef.current = [];
      snappedPathRef.current = [];
      if (snapTimerRef.current) { clearTimeout(snapTimerRef.current); snapTimerRef.current = null; }
      mapRef.current = null;
    };
  }, [ready]);

  // Load historical trail + subscribe to new GPS points for active sessions
  useEffect(() => {
    if (!ready || !mapRef.current || !sessionId || trailLoadedRef.current === sessionId) return;
    trailLoadedRef.current = sessionId;

    (async () => {
      const { data: points } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .order("recorded_at", { ascending: true })
        .limit(500);

      if (!points || points.length === 0 || !mapRef.current) return;

      const trail = points.map(p => new google.maps.LatLng(p.latitude, p.longitude));
      pathRef.current = trail;

      if (latitude != null && longitude != null) {
        appendTrailPoint(latitude, longitude);
      }

      renderPolylines();
      requestSnap();

      // Only fit bounds if not fullscreen (fullscreen auto-follows)
      if (!fullscreen) {
        const bounds = new google.maps.LatLngBounds();
        trail.forEach(pt => bounds.extend(pt));
        mapRef.current.fitBounds(bounds, 40);
      }
    })();

    // Subscribe to realtime GPS points for live trail updates
    const channel = supabase
      .channel(`satnav_trail_${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "telematics_gps_points",
        filter: `telematics_id=eq.${sessionId}`,
      }, (payload) => {
        const p = payload.new as any;
        if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) return;
        if (appendTrailPoint(p.latitude, p.longitude)) {
          renderPolylines();
          requestSnap();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ready, sessionId, fullscreen]);

  // Update target position on each new GPS fix + maintain rolling fix-interval estimate
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const now = performance.now();

    // ── Jitter / outlier guards ───────────────────────────────────────────
    // 1. Stationary detection — speed < 3 km/h ≈ walking pace. GPS heading is
    //    meaningless at low speed and "stationary drift" causes the most
    //    visible bouncing of the marker and trail.
    const movingFastEnough = (speedKmh ?? 0) >= 3;

    // 2. Distance from the previous accepted fix (haversine, metres) — used
    //    both to reject sub-3m jitter and to flag unrealistic teleports.
    const prev = targetPosRef.current;
    let metresFromPrev = 0;
    if (prev) {
      const R = 6371000;
      const dLat = (latitude - prev.lat) * Math.PI / 180;
      const dLng = (longitude - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      metresFromPrev = 2 * R * Math.asin(Math.sqrt(a));
    }

    // 3. Outlier gate — reject teleports >200m unless we genuinely lost signal
    //    for >15s (in which case it's a real reacquisition).
    const tooFar = prev != null && metresFromPrev > 200 &&
      (lastFixTsRef.current == null || (now - lastFixTsRef.current) < 15000);
    if (tooFar) return;

    // Heading: only adopt a new heading when actually moving; otherwise hold
    // the previous heading so the map doesn't spin while parked.
    const rotation = movingFastEnough
      ? (heading ?? prev?.heading ?? 0)
      : (prev?.heading ?? heading ?? 0);

    // Track interval between real fixes (clamped 1500–6000ms) for self-tuning smoothing
    if (lastFixTsRef.current != null) {
      const gap = now - lastFixTsRef.current;
      if (gap > 200 && gap < 15000) {
        fixGapsRef.current.push(gap);
        if (fixGapsRef.current.length > 3) fixGapsRef.current.shift();
      }
    }
    lastFixTsRef.current = now;

    // Seed marker on first fix
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        icon: getArrowIcon(0, isActive),
        zIndex: 999,
      });
    }

    // Set up interpolation: from = current displayed pos, target = new fix.
    // While stationary, re-anchor `from` to `target` so the marker doesn't
    // visibly twitch between near-identical fixes.
    const currentDisplayed = targetPosRef.current ?? { lat: latitude, lng: longitude, heading: rotation, t: now };
    fromPosRef.current = movingFastEnough
      ? { ...currentDisplayed, t: now }
      : { lat: latitude, lng: longitude, heading: rotation, t: now };
    targetPosRef.current = { lat: latitude, lng: longitude, heading: rotation, t: now };

    // Append to trail polyline only when moving AND we've travelled ≥3 m from
    // the last accepted fix. This is the single most important filter — it
    // prevents stationary drift from drawing erratic lines and ensures
    // Snap-to-Roads only ever sees clean input.
    if (movingFastEnough && metresFromPrev >= 3) {
      if (appendTrailPoint(latitude, longitude)) {
        renderPolylines();
        requestSnap();
      }
    }
  }, [latitude, longitude, heading, speedKmh, isActive, getArrowIcon, renderPolylines, requestSnap, appendTrailPoint]);

  // Continuous animation loop — interpolates marker between fixes at 60fps
  useEffect(() => {
    if (!ready) return;

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpAngle = (a: number, b: number, t: number) => {
      let diff = ((b - a + 540) % 360) - 180; // shortest arc
      return a + diff * t;
    };

    const tick = () => {
      const map = mapRef.current;
      const marker = markerRef.current;
      const from = fromPosRef.current;
      const target = targetPosRef.current;

      if (map && marker && from && target) {
        // Estimate fix cadence (avg of last few real gaps), clamped 1500–6000ms
        const gaps = fixGapsRef.current;
        const avgGap = gaps.length > 0
          ? gaps.reduce((s, g) => s + g, 0) / gaps.length
          : 2500;
        const expected = Math.max(1500, Math.min(6000, avgGap));

        const elapsed = performance.now() - target.t;
        const t = Math.max(0, Math.min(1, elapsed / expected));
        const e = easeInOut(t);

        const lat = lerp(from.lat, target.lat, e);
        const lng = lerp(from.lng, target.lng, e);
        const hd = lerpAngle(from.heading, target.heading, e);

        marker.setPosition({ lat, lng });
        marker.setIcon(getArrowIcon(hd, isActiveRef.current));

        // Heading-up: rotate map smoothly
        if (typeof (map as any).setHeading === "function") {
          (map as any).setHeading(hd);
        }

        // Camera follow — only auto-pan in fullscreen sat-nav mode so users
        // can drag/explore the card-mode map without it snapping back.
        if (fullscreenRef.current) {
          const latLng = new google.maps.LatLng(lat, lng);
          map.panTo(latLng);
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [ready, getArrowIcon]);

  // Fullscreen mode — keep existing behavior
  if (fullscreen) {
    return (
      <div className={className} style={{ overflow: "hidden" }}>
        <div className="relative" style={{ height: "100%", width: "100%" }}>
          <div ref={mapDivRef} className="absolute inset-0 z-0" />
          {hasPosition ? (
            <>
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div>
                  {isLive ? (
                    <span style={{ background: "#0f9e75", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      Live
                    </span>
                  ) : lastSeenLabel ? (
                    <Badge variant="secondary" className="gap-1 text-[10px]">{lastSeenLabel}</Badge>
                  ) : null}
                </div>
                <SnapStatusPill status={snapStatus} lastFixLabel={lastFixLabel} />
              </div>
              {/* Road name banner — sits just below the top status bar so it's never covered by the floating session timer */}
              <div
                className="absolute left-3 right-3 z-20"
                style={{
                  top: 56,
                  background: "rgba(28,28,30,0.88)",
                  color: "white",
                  borderRadius: 14,
                  padding: "8px 14px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>
                  On
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }} className="truncate flex-1">
                  {roadName || "Awaiting location…"}
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[5]" style={{ background: "rgba(242,242,247,0.8)" }}>
              <p style={{ fontSize: 14, color: "#8e8e93" }}>No position data yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Non-fullscreen: premium iOS card with top bar, map, bottom bar, gradient line
  return (
    <div
      className={className}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        border: "0.5px solid rgba(0,0,0,0.06)",
        background: "white",
      }}
    >
      {/* Top bar: Live badge + address */}
      <div style={{ background: "white", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          {isLive ? (
            <span style={{ background: "#0f9e75", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live
            </span>
          ) : lastSeenLabel ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">{lastSeenLabel}</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-1 justify-end min-w-0">
          <SnapStatusPill status={snapStatus} lastFixLabel={lastFixLabel} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e" }} className="truncate text-right">
            {roadName || "Awaiting location…"}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: "45vh", minHeight: 240 }}>
        <div ref={mapDivRef} className="absolute inset-0 z-0" />
        {!hasPosition && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[5]" style={{ background: "rgba(242,242,247,0.8)" }}>
            <p style={{ fontSize: 14, color: "#8e8e93" }}>No position data yet</p>
          </div>
        )}
      </div>

      {/* Bottom bar: Speed + limit + engine */}
      <div style={{ background: "white", padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Speed */}
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: isOverSpeed ? "#e24b4a" : "#1c1c1e", lineHeight: 1 }} className={`tabular-nums ${isOverSpeed ? "animate-pulse" : ""}`}>
            {speedMph ?? 0}
          </span>
          <p style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>mph</p>
        </div>

        {/* Speed limit roundel */}
        {speedLimitMph != null && speedLimitMph > 0 && (
          <div style={{ width: 44, height: 44, border: "3px solid #e24b4a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#e24b4a" }} className="tabular-nums">{speedLimitMph}</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Miles today */}
        {dailyMiles != null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1c1c1e", lineHeight: 1 }} className="tabular-nums">
              {dailyMiles}
            </span>
            <span style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>miles today</span>
          </div>
        )}

        {/* Engine status */}
        {ignitionOn != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ignitionOn ? "#0f9e75" : "#c7c7cc" }} />
            <span style={{ fontSize: 12, color: "#8e8e93" }}>{ignitionOn ? "Engine On" : "Engine Off"}</span>
          </div>
        )}
      </div>

    </div>
  );
}

function SnapStatusPill({ status, lastFixLabel }: { status: "idle" | "syncing" | "snapped" | "raw"; lastFixLabel: string | null }) {
  const config = {
    idle:    { dot: "#c7c7cc", label: "Waiting" },
    syncing: { dot: "#f59e0b", label: "Syncing" },
    snapped: { dot: "#0f9e75", label: "Snapped" },
    raw:     { dot: "#8e8e93", label: "Raw GPS" },
  }[status];
  return (
    <span
      title={`Trail status: ${config.label}${lastFixLabel ? ` · last fix ${lastFixLabel}` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 20,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        color: "#3a3a3c",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: config.dot,
        }}
        className={status === "syncing" ? "animate-pulse" : ""}
      />
      {config.label}
      {lastFixLabel && (
        <span style={{ color: "#8e8e93", fontWeight: 500 }}>· {lastFixLabel}</span>
      )}
    </span>
  );
}
