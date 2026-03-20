import { useEffect, useRef, useState } from "react";
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

export function MiniLiveMap({ latitude, longitude, heading, lastSeenAt, isActive }: MiniLiveMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
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

  // Init map once SDK is ready
  useEffect(() => {
    if (!ready || !mapDivRef.current || mapRef.current) return;

    const center = hasPosition
      ? { lat: latitude!, lng: longitude! }
      : { lat: 54.5, lng: -3.5 };

    const map = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      gestureHandling: "none",
      mapTypeId: "roadmap",
      clickableIcons: false,
    });

    mapRef.current = map;

    if (hasPosition) {
      markerRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isActive ? "#3b82f6" : "#9ca3af",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 3,
        },
      });
    }

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [ready]);

  // Update marker position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const pos = { lat: latitude, lng: longitude };
    const iconOpts = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: isActive ? "#3b82f6" : "#9ca3af",
      fillOpacity: 1,
      strokeColor: "white",
      strokeWeight: 3,
    };

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
      markerRef.current.setIcon(iconOpts);
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map,
        icon: iconOpts,
      });
    }

    map.panTo(pos);
  }, [latitude, longitude, heading, isActive]);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
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
