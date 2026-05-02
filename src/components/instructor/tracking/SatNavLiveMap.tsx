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
  const markerShadowRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const polylineCasingRef = useRef<google.maps.Polyline | null>(null);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const trailLoadedRef = useRef<string | null>(null);

  // Client-side reverse-geocode fallback. The poller normally stamps
  // `last_road_name` on gps_devices, but there's a few-second lag on first
  // fix and the field can be blank/"Unnamed Road" on minor lanes. We fill
  // those gaps here so the bottom panel always shows something useful.
  const [fallbackRoadName, setFallbackRoadName] = useState<string | null>(null);
  const lastGeocodeAtRef = useRef<number>(0);
  const lastGeocodePosRef = useRef<{ lat: number; lng: number } | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Treat upstream value as "missing" if null/empty/whitespace/"Unnamed Road"
  const upstreamRoadName =
    typeof roadName === "string" &&
    roadName.trim().length > 0 &&
    !/^unnamed\s+road$/i.test(roadName.trim())
      ? roadName.trim()
      : null;
  const displayRoadName = upstreamRoadName || fallbackRoadName;
  const isFirstFixRef = useRef<boolean>(true);
  // Wall-clock timestamp of the last accepted fix — used to derive an
  // adaptive tween duration that matches the true cadence of the device.
  const lastFixAtRef = useRef<number>(0);
  // Adaptive tween duration in ms for the *current* segment, set by applyFix
  // and read by the rAF loop as `expected`. Defaults to 900 before any fix.
  const tweenMsRef = useRef<number>(900);

  // Sat-nav camera state — separate from marker so we can smooth it more
  // aggressively (a jittery rotating world is nausea-inducing).
  const camHeadingRef = useRef<number>(0);
  const camTiltRef = useRef<number>(0);
  // True only when the map was created with a vector mapId (required for
  // tilt + heading). Otherwise we fall back to flat raster behaviour.
  const vectorReadyRef = useRef<boolean>(false);
  // Last auto-zoom value we applied, so we don't re-set zoom every fix.
  const lastAutoZoomRef = useRef<number | null>(null);

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

  // Trail line removed — show vehicle position only. Refs/snap pipeline are
  // kept intact (so realtime + snap-to-roads logic keeps working in the
  // background), but no polyline is rendered to the map.
  const renderPolylines = useCallback(() => {
    polylineRef.current?.setPath([]);
    polylineCasingRef.current?.setPath([]);
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

  // When fullscreen exits, drop the camera back to flat north-up so the
  // card-mode map doesn't stay tilted/rotated.
  useEffect(() => {
    if (!fullscreen && mapRef.current && vectorReadyRef.current) {
      mapRef.current.moveCamera({ heading: 0, tilt: 0 });
      camHeadingRef.current = 0;
      camTiltRef.current = 0;
    }
  }, [fullscreen]);

  // Client-side reverse-geocode fallback for the road name. Runs only when
  // the upstream `roadName` prop is empty/Unnamed AND we have a position.
  // Throttled to once every 6s, and skips if the vehicle hasn't moved >25 m
  // since the last successful geocode.
  useEffect(() => {
    if (!ready || latitude == null || longitude == null) return;
    if (upstreamRoadName) return; // upstream is fine, no fallback needed

    const now = Date.now();
    if (now - lastGeocodeAtRef.current < 6000) return;

    const last = lastGeocodePosRef.current;
    if (last) {
      const R = 6371000;
      const dLat = (latitude - last.lat) * Math.PI / 180;
      const dLng = (longitude - last.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(last.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      const moved = 2 * R * Math.asin(Math.sqrt(a));
      if (moved < 25 && fallbackRoadName) return;
    }

    lastGeocodeAtRef.current = now;
    lastGeocodePosRef.current = { lat: latitude, lng: longitude };

    if (!geocoderRef.current) {
      try { geocoderRef.current = new google.maps.Geocoder(); } catch { return; }
    }

    let cancelled = false;
    geocoderRef.current.geocode(
      { location: { lat: latitude, lng: longitude } },
      (results, status) => {
        if (cancelled) return;
        if (status !== "OK" || !results || results.length === 0) return;
        // Prefer a result that has a `route` component (an actual road),
        // else fall back to the first formatted address line.
        let road: string | null = null;
        for (const r of results) {
          const route = r.address_components?.find((c) => c.types.includes("route"));
          if (route?.long_name && !/^unnamed\s+road$/i.test(route.long_name)) {
            road = route.long_name;
            break;
          }
        }
        if (!road) {
          const first = results[0].formatted_address?.split(",")[0]?.trim();
          if (first && !/^unnamed\s+road$/i.test(first)) road = first;
        }
        if (road) setFallbackRoadName(road);
      }
    );
    return () => { cancelled = true; };
  }, [ready, latitude, longitude, upstreamRoadName, fallbackRoadName]);

  const getArrowIcon = useCallback((rotation: number, active: boolean): google.maps.Symbol => ({
    path: "M 0,-12 L -7,11 L 0,6 L 7,11 Z",
    fillColor: active ? "#0A84FF" : "#8E8E93",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 1.5,
    scale: active ? 1.6 : 1.2,
    rotation,
    anchor: new google.maps.Point(0, 0),
  }), []);

  // Tight accuracy halo under the arrow — small blue tint, no stroke.
  // Reads as a deliberate accuracy disc rather than a render artifact.
  const getShadowIcon = useCallback((active: boolean): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#0A84FF",
    fillOpacity: 0.18,
    strokeOpacity: 0,
    scale: active ? 18 : 14,
    anchor: new google.maps.Point(0, 0),
  }), []);

  // ── Sat-nav camera helpers ──────────────────────────────────────────────
  // Zoom adapts to speed so the driver sees an appropriate amount of road.
  const zoomForSpeed = useCallback((speedKmh: number | null): number => {
    if (speedKmh == null) return 17;
    if (speedKmh < 20) return 18;
    if (speedKmh < 60) return 17;
    if (speedKmh < 100) return 16;
    return 15;
  }, []);

  // Shortest signed angular delta in degrees from `from` to `to` in [-180, 180].
  const shortestAngleDelta = useCallback((from: number, to: number): number => {
    return ((to - from + 540) % 360) - 180;
  }, []);

  // Given a target lat/lng, return a centre that places the target ~28% from
  // the bottom of the viewport, accounting for the current camera heading so
  // the offset is always "ahead" of the vehicle in screen-space.
  const offsetCenterForLowerThird = useCallback((
    map: google.maps.Map,
    target: { lat: number; lng: number },
    cameraHeadingDeg: number,
  ): { lat: number; lng: number } | null => {
    const proj = map.getProjection();
    const zoom = map.getZoom();
    if (!proj || zoom == null) return null;

    const targetPt = proj.fromLatLngToPoint(new google.maps.LatLng(target));
    if (!targetPt) return null;

    const scale = Math.pow(2, zoom);
    const div = map.getDiv() as HTMLElement;
    const heightPx = div.clientHeight;
    if (!heightPx) return null;

    // Centre at 50%, target at 72% from top → push centre forward by 22%.
    const offsetPx = heightPx * 0.22;

    const headingRad = (cameraHeadingDeg * Math.PI) / 180;
    const dxPx = Math.sin(headingRad) * offsetPx;
    const dyPx = -Math.cos(headingRad) * offsetPx; // y inverted in screen coords

    const dxWorld = dxPx / scale / 256;
    const dyWorld = dyPx / scale / 256;

    const centerPt = new google.maps.Point(
      targetPt.x - dxWorld,
      targetPt.y - dyWorld,
    );
    const centerLatLng = proj.fromPointToLatLng(centerPt);
    return centerLatLng
      ? { lat: centerLatLng.lat(), lng: centerLatLng.lng() }
      : null;
  }, []);
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

    // Light Google Maps default styling — only hide POI + transit labels.
    const navStyles: google.maps.MapTypeStyle[] = [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ];

    // iOS system grey 6 background under the map tiles
    if (mapDivRef.current) {
      mapDivRef.current.style.background = "#F2F2F7";
    }

    // Vector mapId enables tilt + heading-up rotation. When provided we use
    // it (and skip inline `styles`, which Google ignores for vector maps —
    // styling lives in Cloud Console against that map ID). When absent we
    // fall back to the styled raster map (no tilt, no rotation) so the
    // component still works.
    const mapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;
    const mapOptions: google.maps.MapOptions = {
      center,
      zoom: fullscreen ? 18.5 : 17,
      tilt: 0,
      heading: 0,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      mapTypeId: "roadmap",
      clickableIcons: false,
      keyboardShortcuts: false,
      backgroundColor: "#F2F2F7",
    };
    if (mapId) {
      (mapOptions as any).mapId = mapId;
    } else {
      mapOptions.styles = navStyles;
    }
    const map = new google.maps.Map(mapDivRef.current, mapOptions);
    vectorReadyRef.current = !!mapId;

    mapRef.current = map;

    // Trail polylines intentionally not added to the map — we only show the
    // current vehicle position. Snap/realtime data is still tracked in refs.

    if (hasPosition) {
      const pos = new google.maps.LatLng(latitude!, longitude!);
      pathRef.current = [pos];

      markerShadowRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: getShadowIcon(isActive),
        zIndex: 998,
        clickable: false,
      });
      markerRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: getArrowIcon(heading ?? 0, isActive),
        zIndex: 999,
      });
    }

    // User gesture detection — turn off follow mode when the user drags or
    // zooms the map. We only listen to `dragstart` (true user gesture) and
    // `zoom_changed` because `center_changed` also fires from our own panTo.
    const dropToFlat = () => {
      if (vectorReadyRef.current && mapRef.current) {
        mapRef.current.moveCamera({ heading: 0, tilt: 0 });
        camHeadingRef.current = 0;
        camTiltRef.current = 0;
      }
    };
    const onDragStart = () => {
      if (suppressFollowOffRef.current) return;
      if (followModeRef.current) {
        setFollowMode(false);
        if (fullscreenRef.current) dropToFlat();
      }
    };
    const onZoomChanged = () => {
      if (suppressFollowOffRef.current) return;
      if (followModeRef.current) {
        setFollowMode(false);
        if (fullscreenRef.current) dropToFlat();
      }
      // User took zoom control — clear so Re-centre re-applies auto-zoom.
      lastAutoZoomRef.current = null;
    };
    mapListenersRef.current.push(map.addListener("dragstart", onDragStart));
    mapListenersRef.current.push(map.addListener("zoom_changed", onZoomChanged));

    return () => {
      mapListenersRef.current.forEach((l) => l.remove());
      mapListenersRef.current = [];
      markerRef.current?.setMap(null);
      markerRef.current = null;
      markerShadowRef.current?.setMap(null);
      markerShadowRef.current = null;
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

  // When the active session changes, ensure the next fix re-frames the map
  // and the cadence estimator restarts from a clean slate.
  useEffect(() => {
    isFirstFixRef.current = true;
    lastFixAtRef.current = 0;
    camHeadingRef.current = 0;
    camTiltRef.current = 0;
    lastAutoZoomRef.current = null;
  }, [sessionId]);

  // Load historical trail + subscribe to new GPS points for active sessions
  useEffect(() => {
    if (!ready || !mapRef.current || !sessionId || trailLoadedRef.current === sessionId) return;
    trailLoadedRef.current = sessionId;

    (async () => {
      // Trail line is no longer rendered, so we only need *just enough*
      // history to seed the marker's anchor before realtime takes over.
      // Last 5 minutes / 50 rows is plenty at 1Hz.
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: points } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", sessionId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(50);

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

    // ── First-fix handling ────────────────────────────────────────────────
    // On the very first fix for this session, frame the map on the vehicle
    // immediately and skip any tween. Without this, an initialCenter prop
    // could leave the marker off-screen until the next fix arrives.
    if (isFirstFixRef.current) {
      const headingNow = heading ?? 0;
      const initialZoom = zoomForSpeed(speedKmh ?? null);
      lastAutoZoomRef.current = initialZoom;

      // For vector + fullscreen + follow, the world is rotated to heading-up,
      // so the on-screen arrow direction must be compensated to ~0°.
      const useSatNavCam =
        fullscreenRef.current && followModeRef.current && vectorReadyRef.current;
      const screenHeading = useSatNavCam ? 0 : headingNow;

      if (!markerRef.current) {
        markerShadowRef.current = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          icon: getShadowIcon(isActive),
          zIndex: 998,
          clickable: false,
        });
        markerRef.current = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          icon: getArrowIcon(screenHeading, isActive),
          zIndex: 999,
        });
      } else {
        markerRef.current.setPosition({ lat: latitude, lng: longitude });
        markerRef.current.setIcon(getArrowIcon(screenHeading, isActive));
        markerShadowRef.current?.setPosition({ lat: latitude, lng: longitude });
      }
      suppressFollowOffRef.current = true;
      map.setZoom(initialZoom);

      if (useSatNavCam) {
        camHeadingRef.current = headingNow;
        camTiltRef.current = isActiveRef.current ? 50 : 0;
        map.moveCamera({
          heading: camHeadingRef.current,
          tilt: camTiltRef.current,
        });
      }

      // Keep the vehicle pointer centred (no lower-third offset).
      map.setCenter({ lat: latitude, lng: longitude });
      requestAnimationFrame(() => { suppressFollowOffRef.current = false; });

      const seed = { lat: latitude, lng: longitude, heading: headingNow, t: now };
      fromPosRef.current = seed;
      targetPosRef.current = seed;
      lastFixTsRef.current = now;
      lastFixAtRef.current = Date.now();
      pathRef.current = [new google.maps.LatLng(latitude, longitude)];
      isFirstFixRef.current = false;
      return;
    }

    // ── Auto-zoom by speed (fullscreen + follow only) ────────────────────
    if (fullscreenRef.current && followModeRef.current && map) {
      const targetZoom = zoomForSpeed(speedKmh ?? null);
      if (lastAutoZoomRef.current !== targetZoom) {
        suppressFollowOffRef.current = true;
        map.setZoom(targetZoom);
        lastAutoZoomRef.current = targetZoom;
        requestAnimationFrame(() => { suppressFollowOffRef.current = false; });
      }
    }

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

    // Seed marker on first fix (defensive — should already exist after first-fix block)
    if (!markerRef.current) {
      markerShadowRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        icon: getShadowIcon(isActive),
        zIndex: 998,
        clickable: false,
      });
      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        icon: getArrowIcon(0, isActive),
        zIndex: 999,
      });
    }

    // ── Adaptive tween duration ──────────────────────────────────────────
    // Use the wall-clock gap between the previous accepted fix and this one
    // to size the tween. ~80% of the gap, clamped to [250ms, 1200ms].
    //   • At 1Hz: ~800ms (smooth, no lag).
    //   • At 5s gap: capped at 1200ms (still smooth).
    //   • At 10s+: capped at 1200ms so the marker rests between hops rather
    //     than crawling across stale ground.
    const nowMs = Date.now();
    const gapMs = lastFixAtRef.current ? nowMs - lastFixAtRef.current : 900;
    lastFixAtRef.current = nowMs;
    const tweenMs = Math.max(250, Math.min(1200, gapMs * 0.8));
    tweenMsRef.current = tweenMs;

    // ── Small-movement short-circuit (<3 m): snap, don't tween ───────────
    // Kills the "drifting while stationary" effect when GPS jitter delivers
    // a tiny move. Reuses metresFromPrev — no second haversine.
    if (prev && metresFromPrev < 3) {
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
      markerRef.current.setIcon(getArrowIcon(rotation, isActive));
      markerShadowRef.current?.setPosition({ lat: latitude, lng: longitude });
      const snapped = { lat: latitude, lng: longitude, heading: rotation, t: now };
      fromPosRef.current = snapped;
      targetPosRef.current = snapped;
      return;
    }

    // ── Jump rejection (>500 m): snap, don't tween ───────────────────────
    // The "from" point of the next tween must be the *previous animation's
    // destination* (targetPosRef before this update), not the marker's
    // current mid-tween position — otherwise the marker ping-pongs.
    const fromBase = targetPosRef.current ?? (() => {
      const p = markerRef.current?.getPosition();
      return p ? { lat: p.lat(), lng: p.lng(), heading: rotation, t: now } : null;
    })();

    if (fromBase && metresFromPrev > 500) {
      // GPS spike or out-of-order row — snap directly, clear tween state
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
      markerRef.current.setIcon(getArrowIcon(rotation, isActive));
      markerShadowRef.current?.setPosition({ lat: latitude, lng: longitude });
      const snapped = { lat: latitude, lng: longitude, heading: rotation, t: now };
      fromPosRef.current = snapped;
      targetPosRef.current = snapped;
    } else {
      // Normal tween: from = previous tween destination (or marker fallback)
      fromPosRef.current = fromBase
        ? (movingFastEnough ? { ...fromBase, t: now } : { lat: latitude, lng: longitude, heading: rotation, t: now })
        : { lat: latitude, lng: longitude, heading: rotation, t: now };
      targetPosRef.current = { lat: latitude, lng: longitude, heading: rotation, t: now };
    }

    // Append to trail polyline only when moving AND we've travelled ≥3 m from
    // the last accepted fix. This is the single most important filter — it
    // prevents stationary drift from drawing erratic lines and ensures
    // Snap-to-Roads only ever sees clean input.
    // Also gate by ignition: if we explicitly know the engine is off, don't
    // append. If ignitionOn is null/undefined we don't block (legacy behaviour).
    const ignitionAllowsTrail = ignitionOn !== false;
    if (movingFastEnough && metresFromPrev >= 3 && ignitionAllowsTrail) {
      if (appendTrailPoint(latitude, longitude)) {
        renderPolylines();
        requestSnap();
      }
    }
  }, [latitude, longitude, heading, speedKmh, isActive, ignitionOn, getArrowIcon, getShadowIcon, renderPolylines, requestSnap, appendTrailPoint]);

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
        // Adaptive tween duration — set per-segment by applyFix from the
        // real wall-clock gap between fixes, clamped to [250ms, 1200ms].
        // Defaults to 900ms before the first fix has been processed.
        const expected = tweenMsRef.current || 900;

        const elapsed = performance.now() - target.t;
        const t = Math.max(0, Math.min(1, elapsed / expected));
        const e = easeInOut(t);

        const lat = lerp(from.lat, target.lat, e);
        const lng = lerp(from.lng, target.lng, e);
        const hd = lerpAngle(from.heading, target.heading, e);

        const satNavCam =
          fullscreenRef.current && followModeRef.current && vectorReadyRef.current;

        marker.setPosition({ lat, lng });
        // When the world is rotated heading-up, Google rotates marker symbols
        // *with* the world. Compensate by subtracting camera heading so the
        // arrow stays pointing roughly up the screen (and leans into turns
        // while the camera catches up).
        const screenHeading = satNavCam ? hd - camHeadingRef.current : hd;
        marker.setIcon(getArrowIcon(screenHeading, isActiveRef.current));
        markerShadowRef.current?.setPosition({ lat, lng });

        // Sat-nav camera: smoothly tilt + rotate to heading-up. Heavier
        // smoothing than the marker — a jittery world is nausea-inducing.
        if (satNavCam) {
          const camDelta = ((hd - camHeadingRef.current + 540) % 360) - 180;
          camHeadingRef.current = (camHeadingRef.current + camDelta * 0.08 + 360) % 360;
          const targetTilt = isActiveRef.current ? 50 : 0;
          camTiltRef.current += (targetTilt - camTiltRef.current) * 0.05;
          (map as any).moveCamera({
            heading: camHeadingRef.current,
            tilt: camTiltRef.current,
          });
        }

        // Camera follow — only auto-pan in fullscreen sat-nav mode AND when
        // the user hasn't taken over with a drag/zoom. Card-mode map stays
        // free for the user to explore.
        if (fullscreenRef.current && followModeRef.current) {
          // Keep the vehicle pointer centred on screen.
          suppressFollowOffRef.current = true;
          map.panTo({ lat, lng });
          // Release suppression after the next frame — panTo fires its events synchronously
          requestAnimationFrame(() => { suppressFollowOffRef.current = false; });
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

  // Re-centre — restores follow mode and pans the map back to the vehicle.
  const handleRecentre = useCallback(() => {
    setFollowMode(true);
    // Force the next fix to re-apply auto-zoom; the rAF loop will smoothly
    // tilt + rotate back into sat-nav view automatically.
    lastAutoZoomRef.current = null;
    const map = mapRef.current;
    const target = targetPosRef.current;
    if (map && target) {
      suppressFollowOffRef.current = true;
      map.panTo({ lat: target.lat, lng: target.lng });
      requestAnimationFrame(() => { suppressFollowOffRef.current = false; });
    }
  }, []);

  // Fullscreen mode — premium iOS light sat-nav layout
  if (fullscreen) {
    return (
      <div className={className} style={{ overflow: "hidden", background: "#F2F2F7" }}>
        <div className="relative" style={{ height: "100%", width: "100%" }}>
          <div ref={mapDivRef} className="absolute inset-0 z-0" style={{ background: "#F2F2F7" }} />

          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[6] px-6 text-center" style={{ background: "rgba(242,242,247,0.96)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 14 }}>🛰️</div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1C1C1E", letterSpacing: -0.2 }}>Map unavailable</p>
              <p style={{ fontSize: 13, color: "rgba(60,60,67,0.6)", marginTop: 4 }}>Unable to load live map right now.</p>
            </div>
          )}

          {hasPosition && !mapError ? (
            <>
              {/* Map vignettes — soft top + bottom shading so white pills /
                  glass cards don't disappear over bright map areas. */}
              <div
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{
                  top: 0, left: 0, right: 0, height: 100,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%)",
                  zIndex: 1,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{
                  bottom: 0, left: 0, right: 0, height: 80,
                  background: "linear-gradient(0deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)",
                  zIndex: 1,
                }}
              />

              {/* Top bar — signal pill (left). Snap is demoted to a small
                  icon-only indicator stacked on the right (rendered below). */}
              <div
                className="absolute z-10 flex items-center px-3"
                style={{
                  top: "calc(env(safe-area-inset-top, 0px) + 10px)",
                  left: 0,
                  right: 0,
                }}
              >
                <SignalStatusPill status={signalStatus} lastFixLabel={lastFixLabel} />
              </div>

              {/* Snap-active indicator — icon-only, no label, no age.
                  Stacks on the right edge of the top area. Absent when
                  snap isn't actively snapped. */}
              {snapStatus === "snapped" && (
                <div
                  className="absolute z-10"
                  title="Trail snapped to roads"
                  style={{
                    top: "calc(env(safe-area-inset-top, 0px) + 56px)",
                    right: 14,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(14px) saturate(180%)",
                    WebkitBackdropFilter: "blur(14px) saturate(180%)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#34C759",
                      boxShadow: "0 0 6px rgba(52,199,89,0.55)",
                    }}
                  />
                </div>
              )}

              {/* Re-centre button — appears when user has dragged/zoomed.
                  Sits above the FloatingSessionTimer card. */}
              {!followMode && (
                <button
                  type="button"
                  onClick={handleRecentre}
                  className="absolute z-20"
                  style={{
                    right: 14,
                    bottom: "calc(env(safe-area-inset-bottom, 0px) + 180px)",
                    background: "rgba(255,255,255,0.78)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 999,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0A84FF",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>◎</span>
                  Re-centre
                </button>
              )}

              {/* Overspeed banner — sits above the FloatingSessionTimer card */}
              {isOverSpeed && speedMph != null && speedLimitMph != null && (
                <div
                  className="absolute left-3 right-3 z-20"
                  style={{
                    bottom: "calc(env(safe-area-inset-bottom, 0px) + 240px)",
                    background: "linear-gradient(180deg, rgba(255,69,58,0.95) 0%, rgba(225,29,42,0.95) 100%)",
                    color: "white",
                    borderRadius: 16,
                    padding: "12px 16px",
                    boxShadow: "0 12px 30px rgba(225,29,42,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
                    border: "0.5px solid rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠︎</span>
                  <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.1 }} className="truncate flex-1">
                    Over speed limit · {speedMph} mph in a {speedLimitMph} zone
                  </span>
                </div>
              )}

              {/* The bottom sat-nav glass panel (speed/limit/road-name) is
                  intentionally omitted in fullscreen — `FloatingSessionTimer`
                  rendered by the parent owns the single source of truth for
                  the headline (speed, limit, pupil, REC, timer, distance,
                  End). Avoids a duplicate, conflicting card. */}
            </>
          ) : !mapError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[5]" style={{ background: "rgba(242,242,247,0.85)" }}>
              <p style={{ fontSize: 14, color: "rgba(60,60,67,0.6)" }}>No position data yet</p>
            </div>
          ) : null}
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
      {/* Top bar: Signal status + road name */}
      <div style={{ background: "white", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SignalStatusPill status={signalStatus} lastFixLabel={lastFixLabel} />
        <div className="flex items-center gap-2 ml-3 flex-1 justify-end min-w-0">
          <SnapStatusPill status={snapStatus} lastFixLabel={lastFixLabel} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e" }} className="truncate text-right">
            {displayRoadName || "Awaiting location…"}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: "45vh", minHeight: 240 }}>
        <div ref={mapDivRef} className="absolute inset-0 z-0" />
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[6] px-6 text-center" style={{ background: "rgba(242,242,247,0.95)" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1c1c1e" }}>Map unavailable</p>
            <p style={{ fontSize: 12, color: "#8e8e93", marginTop: 4 }}>Unable to load live map right now.</p>
          </div>
        )}
        {!hasPosition && !mapError && (
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

type SignalStatusValue = "waiting" | "live" | "delayed" | "weak" | "lost";

function SignalStatusPill({ status, lastFixLabel, dark = false }: { status: SignalStatusValue; lastFixLabel: string | null; dark?: boolean }) {
  // Light variant — used in card mode on white surfaces.
  const lightConfig: Record<SignalStatusValue, { dot: string; label: string; bg: string; fg: string; pulse: boolean }> = {
    waiting: { dot: "#c7c7cc", label: "Waiting",     bg: "rgba(0,0,0,0.04)",         fg: "#3a3a3c", pulse: false },
    live:    { dot: "#34C759", label: "Live",        bg: "rgba(52,199,89,0.12)",     fg: "#1a7d3a", pulse: true  },
    delayed: { dot: "#FFCC00", label: "Delayed",     bg: "rgba(255,204,0,0.16)",     fg: "#8a6a00", pulse: false },
    weak:    { dot: "#FF9500", label: "Weak GPS",    bg: "rgba(255,149,0,0.14)",     fg: "#a14310", pulse: false },
    lost:    { dot: "#FF3B30", label: "Signal Lost", bg: "rgba(255,59,48,0.12)",     fg: "#a02c2b", pulse: false },
  };
  // Dark glass variant — used in fullscreen sat-nav mode.
  const darkConfig: Record<SignalStatusValue, { dot: string; label: string; fg: string; pulse: boolean }> = {
    waiting: { dot: "#8E8E93", label: "Waiting",     fg: "rgba(255,255,255,0.7)", pulse: false },
    live:    { dot: "#34C759", label: "Live",        fg: "#34C759",               pulse: true  },
    delayed: { dot: "#FFCC00", label: "Delayed",     fg: "#FFCC00",               pulse: false },
    weak:    { dot: "#FF9500", label: "Weak GPS",    fg: "#FF9500",               pulse: false },
    lost:    { dot: "#FF3B30", label: "Signal Lost", fg: "#FF3B30",               pulse: false },
  };

  if (dark) {
    const c = darkConfig[status];
    return (
      <span
        title={`Signal: ${c.label}${lastFixLabel ? ` · last fix ${lastFixLabel}` : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(20,20,22,0.62)",
          backdropFilter: "blur(14px) saturate(180%)",
          WebkitBackdropFilter: "blur(14px) saturate(180%)",
          border: "0.5px solid rgba(255,255,255,0.18)",
          borderRadius: 20,
          padding: "5px 11px",
          fontSize: 11,
          fontWeight: 700,
          color: c.fg,
          whiteSpace: "nowrap",
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: c.dot,
            boxShadow: status === "live" ? `0 0 8px ${c.dot}, 0 0 0 3px rgba(52,199,89,0.18)` : "none",
          }}
          className={c.pulse ? "animate-pulse" : ""}
        />
        {c.label}
        {lastFixLabel && status !== "live" && (
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>· {lastFixLabel}</span>
        )}
      </span>
    );
  }

  const c = lightConfig[status];
  return (
    <span
      title={`Signal: ${c.label}${lastFixLabel ? ` · last fix ${lastFixLabel}` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px) saturate(180%)",
        WebkitBackdropFilter: "blur(14px) saturate(180%)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        color: "#1C1C1E",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.dot,
          boxShadow: status === "live" ? `0 0 0 4px rgba(52,199,89,0.2)` : "none",
        }}
        className={c.pulse ? "animate-pulse" : ""}
      />
      {c.label}
      {lastFixLabel && status !== "live" && (
        <span style={{ color: "rgba(60,60,67,0.6)", fontWeight: 500 }}>· {lastFixLabel}</span>
      )}
    </span>
  );
}
