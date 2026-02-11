import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";

interface MiniLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  lastSeenAt: string | null;
  isActive: boolean;
}

export function MiniLiveMap({ latitude, longitude, heading, lastSeenAt, isActive }: MiniLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Status logic
  const isLive = lastSeenAt && (Date.now() - new Date(lastSeenAt).getTime() < 30000);
  const lastSeenLabel = lastSeenAt
    ? formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })
    : null;

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const lat = latitude ?? 54.5;
    const lng = longitude ?? -3.5;

    mapInstance.current = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer(getMapTileUrl(), {
      maxZoom: 19,
      attribution: getMapAttribution(),
    }).addTo(mapInstance.current);

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.current?.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update marker + center
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || latitude === null || longitude === null) return;

    const rotation = heading ?? 0;
    const bgColor = isActive ? "#3b82f6" : "#9ca3af";
    const iconHtml = `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:${bgColor};box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
        <div style="position:relative;width:18px;height:18px;transform:rotate(${rotation}deg);z-index:1;">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: "mini-map-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    }

    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, heading, isActive]);

  const hasPosition = latitude !== null && longitude !== null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-[200px]">
        {hasPosition ? (
          <>
            <div ref={mapRef} className="absolute inset-0" />
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
      <style>{`
        .mini-map-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
