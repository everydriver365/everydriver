import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";

interface MiniLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh?: number | null;
  lastSeenAt: string | null;
  isActive: boolean;
}

const ARROW_SVG_PATH =
  "M12 2 L6 20 L12 16 L18 20 Z";

export function MiniLiveMap({ latitude, longitude, heading, lastSeenAt, isActive }: MiniLiveMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const [ready, setReady] = useState(false);

  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;
  const hasPosition = latitude !== null && longitude !== null;

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
        console.error("Failed to load Google Maps for MiniLiveMap:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getArrowIcon = useCallback((rotation: number, active: boolean): google.maps.Symbol => ({
    path: "M 0,-8 L -5,8 L 0,4 L 5,8 Z",
    fillColor: active ? "#3b82f6" : "#9ca3af",
    fillOpacity: 1,
    strokeColor: "white",
    strokeWeight: 2,
    scale: 2.2,
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
      zoom: 16,
      disableDefaultUI: true,
      gestureHandling: "none",
      mapTypeId: "roadmap",
      clickableIcons: false,
    });

    mapRef.current = map;

    // Create route polyline
    polylineRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#3b82f6",
      strokeOpacity: 0.7,
      strokeWeight: 4,
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

  // Update marker, polyline, and auto-follow
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const pos = { lat: latitude, lng: longitude };
    const latLng = new google.maps.LatLng(latitude, longitude);
    const rotation = heading ?? 0;

    // Update or create arrow marker
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
      markerRef.current.setIcon(getArrowIcon(rotation, isActive));
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map,
        icon: getArrowIcon(rotation, isActive),
      });
    }

    // Append to route polyline (deduplicate close points)
    const lastPt = pathRef.current[pathRef.current.length - 1];
    const shouldAdd = !lastPt ||
      Math.abs(lastPt.lat() - latitude) > 0.00005 ||
      Math.abs(lastPt.lng() - longitude) > 0.00005;

    if (shouldAdd) {
      pathRef.current.push(latLng);
      polylineRef.current?.setPath(pathRef.current);
    }

    // Auto-follow: smooth pan to new position
    map.panTo(pos);
  }, [latitude, longitude, heading, isActive, getArrowIcon]);

  return (
    <div className="rounded-none border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-[200px]">
        {hasPosition ? (
          <>
            <div ref={mapDivRef} className="absolute inset-0 z-0" />
            <div className="absolute top-3 left-3 z-10">
              {isLive ? (
                <Badge className="bg-green-600 text-white border-0 gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Live
                </Badge>
              ) : lastSeenLabel ? (
                <Badge variant="secondary" className="gap-1">
                  Last seen {lastSeenLabel}
                </Badge>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div ref={mapDivRef} className="absolute inset-0 z-0" />
            <div className="absolute inset-0 bg-muted/80 flex flex-col items-center justify-center z-[5]">
              <p className="text-sm text-muted-foreground">No position data yet</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
