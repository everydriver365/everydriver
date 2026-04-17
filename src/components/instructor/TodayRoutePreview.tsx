import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { motion } from "framer-motion";
import { MapPin, Clock, Navigation, Loader2 } from "lucide-react";
import L from "leaflet";
import { useTodayRoute } from "@/hooks/useTodayRoute";
import { cn } from "@/lib/utils";
import { getMapTileUrl } from "@/lib/mapConfig";
import "leaflet/dist/leaflet.css";

interface TodayRoutePreviewProps {
  instructorId: string | null | undefined;
  className?: string;
  onTap?: () => void;
}

// Custom numbered marker icon
function createNumberedIcon(number: number) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${number}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Auto-fit bounds to markers
function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    }
  }, [map, points]);

  return null;
}

export function TodayRoutePreview({
  instructorId,
  className,
  onTap,
}: TodayRoutePreviewProps) {
  const { points, totalStops, estimatedDriveMinutes, isLoading, error } = useTodayRoute(instructorId);

  // Don't show if less than 2 stops
  if (!isLoading && points.length < 2) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("mb-4", className)}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
           className="overflow-hidden"
           style={{ backgroundColor: '#FFFFFF', borderRadius: 14, boxShadow: '0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)' }}
        >
           <div className="h-40 flex items-center justify-center bg-gray-50">
             <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const polylinePositions = points.map((p) => [p.lat, p.lng] as [number, number]);
  const defaultCenter = points.length > 0 
    ? [points[0].lat, points[0].lng] as [number, number]
    : [51.5074, -0.1278] as [number, number];

  return (
    <div className={cn("mb-4", className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
         className="overflow-hidden cursor-pointer transition-all"
         style={{ backgroundColor: '#FFFFFF', borderRadius: 14, boxShadow: '0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)' }}
        onClick={onTap}
      >
        {/* Header */}
         <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium">Today's Route</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {totalStops} stops
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{estimatedDriveMinutes} min
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="h-32">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            className="h-full w-full"
          >
            <TileLayer url={getMapTileUrl()} />
            
            <FitBounds points={points} />

            {/* Route polyline */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: "hsl(220, 52%, 30%)",
                weight: 3,
                opacity: 0.8,
                dashArray: "8, 8",
              }}
            />

            {/* Markers */}
            {points.map((point, index) => (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={createNumberedIcon(index + 1)}
              />
            ))}
          </MapContainer>
        </div>

        {/* Footer - Pickup list */}
        <div className="px-3 py-2 bg-muted/30 border-t border-border/50">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {points.slice(0, 4).map((point, index) => (
              <div
                key={point.id}
                className="flex items-center gap-1.5 shrink-0 text-xs"
              >
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground 
                  text-[10px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-muted-foreground truncate max-w-24">
                  {point.pupilName.split(" ")[0]}
                </span>
                {index < Math.min(points.length - 1, 3) && (
                  <span className="text-muted-foreground/50">→</span>
                )}
              </div>
            ))}
            {points.length > 4 && (
              <span className="text-xs text-muted-foreground shrink-0">
                +{points.length - 4} more
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
