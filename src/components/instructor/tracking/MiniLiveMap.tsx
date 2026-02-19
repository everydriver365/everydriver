import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { loadGoogleMaps, fetchGoogleMapsKey } from "@/lib/googleMapsLoader";

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
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;

  // Init Google Map
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapDivRef.current || mapRef.current) return;
      try {
        const apiKey = await fetchGoogleMapsKey();
        if (!apiKey || cancelled) return;
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const w = window as any;
        const center = latitude != null && longitude != null
          ? { lat: latitude, lng: longitude }
          : { lat: 54.5, lng: -3.5 };

        const map = new w.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: "none",
          clickableIcons: false,
          keyboardShortcuts: false,
        });
        mapRef.current = map;

        markerRef.current = new w.google.maps.Marker({
          position: center,
          map,
          icon: {
            path: w.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillOpacity: 1,
            fillColor: isActive ? "#3b82f6" : "#9ca3af",
            strokeColor: "white",
            strokeWeight: 3,
            rotation: heading ?? 0,
          },
        });

        setReady(true);
      } catch {
        // silently fail
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Update marker position + icon
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || latitude == null || longitude == null) return;

    const w = window as any;
    const pos = { lat: latitude, lng: longitude };
    marker.setPosition(pos);
    marker.setIcon({
      path: w.google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillOpacity: 1,
      fillColor: isActive ? "#3b82f6" : "#9ca3af",
      strokeColor: "white",
      strokeWeight: 3,
      rotation: heading ?? 0,
    });
    map.panTo(pos);
  }, [latitude, longitude, heading, isActive]);

  const hasPosition = latitude !== null && longitude !== null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-[200px]">
        {hasPosition || ready ? (
          <>
            <div ref={mapDivRef} className="absolute inset-0" />
            {/* Status badge */}
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
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">No position data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
