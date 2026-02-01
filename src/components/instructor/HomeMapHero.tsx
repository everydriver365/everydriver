import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";

interface HomeMapHeroProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  roadName: string | null;
  isActive: boolean;
  isLoading: boolean;
}

// Default UK center (Midlands)
const DEFAULT_LAT = 52.48;
const DEFAULT_LNG = -1.89;

export function HomeMapHero({
  latitude,
  longitude,
  heading,
  roadName,
  isActive,
  isLoading,
}: HomeMapHeroProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const lat = latitude ?? DEFAULT_LAT;
    const lng = longitude ?? DEFAULT_LNG;

    mapInstance.current = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: false,
    });

    L.tileLayer(getMapTileUrl(), {
      maxZoom: 19,
      attribution: getMapAttribution(),
    }).addTo(mapInstance.current);

    // Position zoom controls on the right
    mapInstance.current.zoomControl?.setPosition("topright");

    // Handle resize
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

  // Update marker and view when position changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const lat = latitude ?? DEFAULT_LAT;
    const lng = longitude ?? DEFAULT_LNG;

    // Car icon with green circle background (matching mockup)
    const rotation = heading ?? 0;
    const iconHtml = `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 3px 12px rgba(0,0,0,0.25);
        "></div>
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          z-index: 1;
        ">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        ${isActive ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            background: #10b981;
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 4px;
            border-radius: 4px;
            white-space: nowrap;
          ">24</div>
        ` : ''}
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: "home-map-marker",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(icon);
    }

    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [latitude, longitude, heading, isActive]);

  return (
    <div className="relative w-full h-56">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Road name overlay at bottom */}
      {roadName && (
        <div className="absolute bottom-2 left-2 z-20">
          <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium px-3 py-1 rounded-full shadow-sm border">
            {roadName}
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Custom marker styles */}
      <style>{`
        .home-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-marker-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
