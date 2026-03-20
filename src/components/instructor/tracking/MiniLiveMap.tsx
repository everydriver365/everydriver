import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;

  const hasPosition = latitude !== null && longitude !== null;

  // Init Leaflet map
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const center: L.LatLngExpression = hasPosition
      ? [latitude!, longitude!]
      : [54.5, -3.5];

    const map = L.map(mapDivRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (hasPosition) {
      markerRef.current = L.circleMarker([latitude!, longitude!], {
        radius: 10,
        fillColor: isActive ? "#3b82f6" : "#9ca3af",
        fillOpacity: 1,
        color: "white",
        weight: 3,
      }).addTo(map);
    }

    // Fix tile rendering after container is visible
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const pos: L.LatLngExpression = [latitude, longitude];

    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
      markerRef.current.setStyle({
        fillColor: isActive ? "#3b82f6" : "#9ca3af",
      });
    } else {
      markerRef.current = L.circleMarker(pos, {
        radius: 10,
        fillColor: isActive ? "#3b82f6" : "#9ca3af",
        fillOpacity: 1,
        color: "white",
        weight: 3,
      }).addTo(map);
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
