import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { GpsPoint } from "@/hooks/useTripReplay";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import "leaflet/dist/leaflet.css";

interface TripReplayMapProps {
  gpsPoints: GpsPoint[];
  currentIndex: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
}

// Component to handle map view updates
function MapUpdater({ 
  currentPoint, 
  bounds, 
  shouldFitBounds 
}: { 
  currentPoint: GpsPoint | null;
  bounds: TripReplayMapProps["bounds"];
  shouldFitBounds: boolean;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && bounds && shouldFitBounds) {
      const leafletBounds = L.latLngBounds(
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng]
      );
      map.fitBounds(leafletBounds, { padding: [30, 30] });
      hasInitialized.current = true;
    }
  }, [map, bounds, shouldFitBounds]);

  return null;
}

export function TripReplayMap({ gpsPoints, currentIndex, bounds }: TripReplayMapProps) {
  const currentPoint = gpsPoints[currentIndex] || null;

  // Split route into travelled and remaining
  const { travelledPath, remainingPath } = useMemo(() => {
    const travelled = gpsPoints.slice(0, currentIndex + 1).map(p => [p.latitude, p.longitude] as [number, number]);
    const remaining = gpsPoints.slice(currentIndex).map(p => [p.latitude, p.longitude] as [number, number]);
    return { travelledPath: travelled, remainingPath: remaining };
  }, [gpsPoints, currentIndex]);

  // Color segments by speed compliance
  const speedSegments = useMemo(() => {
    const segments: { path: [number, number][]; color: string }[] = [];
    let currentSegment: { path: [number, number][]; color: string } | null = null;

    for (let i = 0; i < Math.min(currentIndex + 1, gpsPoints.length); i++) {
      const point = gpsPoints[i];
      const speed = point.speed_kmh || 0;
      const limit = point.speed_limit_kmh;

      let color: string;
      if (!limit) {
        color = "hsl(var(--primary))";
      } else if (speed > limit + 10) {
        color = "hsl(var(--destructive))";
      } else if (speed > limit) {
        color = "hsl(35 100% 50%)"; // amber
      } else {
        color = "hsl(142 76% 36%)"; // green
      }

      const position: [number, number] = [point.latitude, point.longitude];

      if (!currentSegment || currentSegment.color !== color) {
        if (currentSegment && currentSegment.path.length > 0) {
          // Connect segments
          currentSegment.path.push(position);
          segments.push(currentSegment);
        }
        currentSegment = { path: [position], color };
      } else {
        currentSegment.path.push(position);
      }
    }

    if (currentSegment && currentSegment.path.length > 1) {
      segments.push(currentSegment);
    }

    return segments;
  }, [gpsPoints, currentIndex]);

  const center: [number, number] = currentPoint 
    ? [currentPoint.latitude, currentPoint.longitude]
    : bounds 
      ? [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2]
      : [51.5074, -0.1278];

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full rounded-none"
      zoomControl={false}
    >
      <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
      
      <MapUpdater 
        currentPoint={currentPoint} 
        bounds={bounds} 
        shouldFitBounds={gpsPoints.length > 0}
      />

      {/* Remaining route (grey/faded) */}
      {remainingPath.length > 1 && (
        <Polyline
          positions={remainingPath}
          color="hsl(var(--muted-foreground))"
          weight={4}
          opacity={0.3}
        />
      )}

      {/* Speed-colored travelled segments */}
      {speedSegments.map((segment, i) => (
        <Polyline
          key={i}
          positions={segment.path}
          color={segment.color}
          weight={5}
          opacity={0.9}
        />
      ))}

      {/* Start marker */}
      {gpsPoints.length > 0 && (
        <CircleMarker
          center={[gpsPoints[0].latitude, gpsPoints[0].longitude]}
          radius={8}
          fillColor="hsl(142 76% 36%)"
          fillOpacity={1}
          color="white"
          weight={2}
        />
      )}

      {/* End marker */}
      {gpsPoints.length > 1 && currentIndex >= gpsPoints.length - 1 && (
        <CircleMarker
          center={[gpsPoints[gpsPoints.length - 1].latitude, gpsPoints[gpsPoints.length - 1].longitude]}
          radius={8}
          fillColor="hsl(var(--destructive))"
          fillOpacity={1}
          color="white"
          weight={2}
        />
      )}

      {/* Current position marker */}
      {currentPoint && currentIndex < gpsPoints.length - 1 && (
        <CircleMarker
          center={[currentPoint.latitude, currentPoint.longitude]}
          radius={10}
          fillColor="hsl(var(--primary))"
          fillOpacity={1}
          color="white"
          weight={3}
        />
      )}
    </MapContainer>
  );
}
