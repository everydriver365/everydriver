import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { getMapTileUrl, getMapAttribution } from '@/lib/mapConfig';

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface RouteMapViewProps {
  gpsPoints: GPSPoint[];
  title?: string;
  height?: string;
}

const RouteMapView: React.FC<RouteMapViewProps> = ({ 
  gpsPoints, 
  title = "Lesson Route",
  height = "300px"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || gpsPoints.length === 0) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Calculate bounds
    const lats = gpsPoints.map(p => p.latitude);
    const lngs = gpsPoints.map(p => p.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Initialize map
    const map = L.map(mapContainer.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      scrollWheelZoom: false
    });

    mapRef.current = map;

    // Add tile layer
    L.tileLayer(getMapTileUrl(), {
      attribution: getMapAttribution()
    }).addTo(map);

    // Create route line with speed-based coloring
    const routePoints = gpsPoints.map(p => [p.latitude, p.longitude] as [number, number]);
    
    // Draw route segments with color based on speed
    for (let i = 0; i < gpsPoints.length - 1; i++) {
      const startPoint = gpsPoints[i];
      const endPoint = gpsPoints[i + 1];
      const speed = startPoint.speed_kmh || 0;
      
      // Color based on speed: green (slow) -> yellow (moderate) -> red (fast)
      let color = '#22c55e'; // green
      if (speed > 50) color = '#eab308'; // yellow
      if (speed > 80) color = '#f97316'; // orange
      if (speed > 100) color = '#ef4444'; // red

      L.polyline(
        [
          [startPoint.latitude, startPoint.longitude],
          [endPoint.latitude, endPoint.longitude]
        ],
        { color, weight: 4, opacity: 0.8 }
      ).addTo(map);
    }

    // Add start marker
    const startPoint = gpsPoints[0];
    const startIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
      .addTo(map)
      .bindPopup(`<strong>Start</strong><br/>Time: ${new Date(startPoint.recorded_at).toLocaleTimeString()}`);

    // Add end marker
    const endPoint = gpsPoints[gpsPoints.length - 1];
    const endIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([endPoint.latitude, endPoint.longitude], { icon: endIcon })
      .addTo(map)
      .bindPopup(`<strong>End</strong><br/>Time: ${new Date(endPoint.recorded_at).toLocaleTimeString()}`);

    // Fit bounds to show entire route
    if (routePoints.length > 1) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [gpsPoints]);

  if (gpsPoints.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Navigation className="h-8 w-8 mb-2" />
          <p className="text-sm">No GPS data available for this lesson</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          style={{ height, width: '100%' }} 
          className="rounded-2xl"
        />
        {/* Speed Legend */}
        <div className="flex items-center justify-center gap-4 py-2 px-4 bg-muted/30 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>&lt;30 mph</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>30-50 mph</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>50-60 mph</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>&gt;60 mph</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteMapView;
