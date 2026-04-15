import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { supabase } from "@/integrations/supabase/client";
import { formatMph } from "@/lib/utils";
import SpeedLimitRoundel from "@/components/instructor/SpeedLimitRoundel";

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
}

export function SatNavLiveMap({
  latitude, longitude, heading, speedKmh, speedLimitKmh, roadName,
  lastSeenAt, isActive, sessionId, ignitionOn, dailyDistanceKm,
}: SatNavLiveMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const [ready, setReady] = useState(false);
  const trailLoadedRef = useRef<string | null>(null);

  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;
  const hasPosition = latitude !== null && longitude !== null;

  const speedMph = speedKmh != null ? Math.round(speedKmh * 0.621371) : null;
  const isOverSpeed = speedKmh != null && speedLimitKmh != null && speedKmh > speedLimitKmh;
  const dailyMiles = dailyDistanceKm != null ? Math.round(dailyDistanceKm * 0.621371) : null;

  // Load Google Maps SDK
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key || cancelled) return;
        await loadGoogleMaps(key);
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Failed to load Google Maps for SatNavLiveMap:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getArrowIcon = useCallback((rotation: number, active: boolean): google.maps.Symbol => ({
    path: "M 0,-10 L -6,10 L 0,5 L 6,10 Z",
    fillColor: active ? "#3b82f6" : "#9ca3af",
    fillOpacity: 1,
    strokeColor: "white",
    strokeWeight: 2.5,
    scale: 2.8,
    rotation: rotation,
    anchor: new google.maps.Point(0, 0),
  }), []);

  // Init map once SDK is ready
  useEffect(() => {
    if (!ready || !mapDivRef.current || mapRef.current) return;

    const center = hasPosition
      ? { lat: latitude!, lng: longitude! }
      : { lat: 54.5, lng: -3.5 };

    const map = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: 17,
      tilt: 45,
      heading: heading ?? 0,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      mapTypeId: "roadmap",
      clickableIcons: false,
      mapId: "sat-nav-map",
    });

    mapRef.current = map;

    polylineRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#3b82f6",
      strokeOpacity: 0.7,
      strokeWeight: 5,
    });

    if (hasPosition) {
      const pos = new google.maps.LatLng(latitude!, longitude!);
      pathRef.current = [pos];
      polylineRef.current.setPath(pathRef.current);

      markerRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: getArrowIcon(heading ?? 0, isActive),
      });
    }

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      pathRef.current = [];
      mapRef.current = null;
    };
  }, [ready]);

  // Load historical trail
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
        pathRef.current.push(new google.maps.LatLng(latitude, longitude));
      }

      polylineRef.current?.setPath(pathRef.current);

      const bounds = new google.maps.LatLngBounds();
      trail.forEach(pt => bounds.extend(pt));
      mapRef.current.fitBounds(bounds, 40);
    })();
  }, [ready, sessionId]);

  // Update marker, polyline, heading-up rotation, and auto-follow
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const pos = { lat: latitude, lng: longitude };
    const latLng = new google.maps.LatLng(latitude, longitude);
    const rotation = heading ?? 0;

    // Heading-up: rotate the map so vehicle always faces up
    if (typeof (map as any).setHeading === "function") {
      (map as any).setHeading(rotation);
    }

    // Update or create arrow marker
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
      // In heading-up mode the marker arrow should point up (0) since the map rotates
      markerRef.current.setIcon(getArrowIcon(0, isActive));
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map,
        icon: getArrowIcon(0, isActive),
      });
    }

    // Append to route polyline
    const lastPt = pathRef.current[pathRef.current.length - 1];
    const shouldAdd = !lastPt ||
      Math.abs(lastPt.lat() - latitude) > 0.000005 ||
      Math.abs(lastPt.lng() - longitude) > 0.000005;

    if (shouldAdd) {
      pathRef.current.push(latLng);
      polylineRef.current?.setPath(pathRef.current);
    }

    map.panTo(pos);
  }, [latitude, longitude, heading, isActive, getArrowIcon]);

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative" style={{ height: "55vh", minHeight: 320 }}>
        {/* Map canvas */}
        <div ref={mapDivRef} className="absolute inset-0 z-0" />

        {hasPosition ? (
          <>
            {/* Top frosted bar: Live badge + road name */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2.5 bg-white/80 dark:bg-black/60 backdrop-blur-md border-b border-white/20">
              <div>
                {isLive ? (
                  <Badge className="bg-green-600 text-white border-0 gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Live
                  </Badge>
                ) : lastSeenLabel ? (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    {lastSeenLabel}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-foreground truncate ml-3 flex-1 text-right">
                {roadName || "Awaiting location…"}
              </p>
            </div>

            {/* Bottom HUD: Speed + limit + telemetry */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-3 bg-white/80 dark:bg-black/60 backdrop-blur-md border-t border-white/20">
              <div className="flex items-end justify-between">
                {/* Speed readout */}
                <div className="flex items-end gap-2.5">
                  <div className="text-center">
                    <span className={`text-4xl font-bold tabular-nums leading-none ${isOverSpeed ? "text-red-600 animate-pulse" : "text-foreground"}`}>
                      {speedMph ?? 0}
                    </span>
                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">mph</p>
                  </div>
                  {speedLimitKmh != null && speedLimitKmh > 0 && (
                    <SpeedLimitRoundel
                      speedLimit={speedLimitKmh}
                      isExceeding={isOverSpeed}
                      size="sm"
                    />
                  )}
                </div>

                {/* Telemetry strip */}
                <div className="flex flex-col items-end gap-0.5">
                  {ignitionOn != null && (
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${ignitionOn ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {ignitionOn ? "Engine On" : "Engine Off"}
                      </span>
                    </div>
                  )}
                  {dailyMiles != null && dailyMiles > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Today: {dailyMiles} mi
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-muted/80 flex flex-col items-center justify-center z-[5]">
            <p className="text-sm text-muted-foreground">No position data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
