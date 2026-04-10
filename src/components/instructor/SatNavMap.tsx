import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SatNavMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function SatNavMap({ latitude, longitude, className = "" }: SatNavMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
    });

    // Use TomTom tiles if API key available, otherwise fallback to OSM
    const tomtomApiKey = import.meta.env.VITE_TOMTOM_API_KEY;
    
    if (tomtomApiKey) {
      L.tileLayer(
        `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomApiKey}`,
        {
          attribution: '© TomTom',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }

    // Add marker
    L.marker([latitude, longitude]).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new marker and center
    L.marker([latitude, longitude]).addTo(map);
    map.setView([latitude, longitude], 15);
  }, [latitude, longitude, mapReady]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-48 rounded-none overflow-hidden border ${className}`}
      style={{ minHeight: "192px" }}
    />
  );
}
