import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Square, Clock, Route } from "lucide-react";
import { useLessonRouteRecorder } from "@/hooks/useLessonRouteRecorder";
import { fetchGoogleMapsKey, loadGoogleMaps, callSnapToRoad } from "@/lib/googleMapsLoader";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";

interface LessonRouteRecorderProps {
  instructorId: string;
  pupilId?: string | null;
  lessonId?: string | null;
  onRouteRecorded?: () => void;
}

export function LessonRouteRecorder({
  instructorId,
  pupilId,
  lessonId,
  onRouteRecorded,
}: LessonRouteRecorderProps) {
  const { activeProvider, isLoading: providerLoading } = useActiveTrackingProvider(instructorId);

  const {
    isRecording,
    coordinates,
    distanceKm,
    elapsedSeconds,
    startRecording,
    stopRecording,
    error,
  } = useLessonRouteRecorder(instructorId, pupilId, lessonId);

  const [isStopping, setIsStopping] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const snappedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const lastSnappedCountRef = useRef(0);
  const snappedPathRef = useRef<Array<{ lat: number; lng: number }>>([]);

  // Load Google Maps SDK
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key || cancelled) return;
        await loadGoogleMaps(key);
        if (!cancelled) setMapsReady(true);
      } catch (e) {
        console.error("[RouteRecorder] Failed to load Google Maps:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getArrowIcon = useCallback((active: boolean): google.maps.Symbol => ({
    path: "M 0,-8 L -5,8 L 0,4 L 5,8 Z",
    fillColor: active ? "#3b82f6" : "#9ca3af",
    fillOpacity: 1,
    strokeColor: "white",
    strokeWeight: 2,
    scale: 2.2,
    rotation: 0,
    anchor: new google.maps.Point(0, 0),
  }), []);

  // Init/destroy map based on recording state + SDK readiness
  useEffect(() => {
    if (!isRecording || !mapsReady || !mapDivRef.current) return;
    if (mapRef.current) return;

    const center = coordinates.length > 0
      ? { lat: coordinates[coordinates.length - 1].lat, lng: coordinates[coordinates.length - 1].lng }
      : { lat: 51.5074, lng: -0.1278 };

    const map = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      gestureHandling: "none",
      mapTypeId: "roadmap",
      clickableIcons: false,
    });
    mapRef.current = map;

    // Raw GPS polyline (faint, shown while waiting for snap)
    polylineRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#93c5fd",
      strokeOpacity: 0.4,
      strokeWeight: 3,
    });

    // Snapped polyline (bold, road-hugging)
    snappedPolylineRef.current = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#3b82f6",
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });

    lastSnappedCountRef.current = 0;
    snappedPathRef.current = [];

    return () => {
      startMarkerRef.current?.setMap(null);
      startMarkerRef.current = null;
      currentMarkerRef.current?.setMap(null);
      currentMarkerRef.current = null;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      snappedPolylineRef.current?.setMap(null);
      snappedPolylineRef.current = null;
      mapRef.current = null;
    };
  }, [isRecording, mapsReady]);

  // Update polyline + markers as coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || coordinates.length === 0) return;

    const path = coordinates.map(c => ({ lat: c.lat, lng: c.lng }));
    polylineRef.current?.setPath(path);

    // Start marker (green circle)
    const startPos = path[0];
    if (!startMarkerRef.current) {
      startMarkerRef.current = new google.maps.Marker({
        position: startPos,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
          scale: 6,
        },
      });
    }

    // Current position marker (blue arrow)
    const currentPos = path[path.length - 1];
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setPosition(currentPos);
    } else {
      currentMarkerRef.current = new google.maps.Marker({
        position: currentPos,
        map,
        icon: getArrowIcon(true),
      });
    }

    map.panTo(currentPos);

    // Snap-to-road every 5 new GPS points
    const newCount = coordinates.length;
    if (newCount - lastSnappedCountRef.current >= 5) {
      lastSnappedCountRef.current = newCount;
      callSnapToRoad(path)
        .then((snapped) => {
          if (snapped.length > 0) {
            snappedPathRef.current = snapped;
            snappedPolylineRef.current?.setPath(snapped);
          }
        })
        .catch((e) => console.warn("[RouteRecorder] Snap-to-road failed:", e));
    }
  }, [coordinates, getArrowIcon]);

  // Hide when a hardware tracker auto-captures routes
  if (!providerLoading && activeProvider === "radius") {
    return null;
  }

  const handleStop = async () => {
    setIsStopping(true);
    await stopRecording();
    setIsStopping(false);
    onRouteRecorded?.();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const distanceMiles = (distanceKm * 0.621371).toFixed(1);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Controls */}
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Route Recorder</span>
          </div>

          {isRecording ? (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse gap-1 text-xs">
                <div className="h-2 w-2 rounded-full bg-white" />
                REC
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(elapsedSeconds)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {distanceMiles} mi
              </Badge>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                disabled={isStopping}
                className="h-7 px-2 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={startRecording}
              className="h-7 px-3 text-xs gap-1"
            >
              <Navigation className="h-3 w-3" />
              Record Route
            </Button>
          )}
        </div>

        {/* Live Map Preview (only when recording with coordinates) */}
        {isRecording && coordinates.length > 0 && (
          <div className="h-48 border-t">
            <div ref={mapDivRef} className="h-full w-full" />
          </div>
        )}

        {error && (
          <div className="px-3 pb-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
