import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Square, MapPin, Clock, Route } from "lucide-react";
import { useLessonRouteRecorder } from "@/hooks/useLessonRouteRecorder";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import "leaflet/dist/leaflet.css";

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

  const routePath = coordinates.map((c) => [c.lat, c.lng] as [number, number]);
  const center: [number, number] =
    routePath.length > 0
      ? routePath[routePath.length - 1]
      : [51.5074, -0.1278];

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

        {/* Live Map Preview (only when recording) */}
        {isRecording && routePath.length > 0 && (
          <div className="h-48 border-t">
            <MapContainer
              center={center}
              zoom={15}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
              <Polyline
                positions={routePath}
                color="hsl(var(--primary))"
                weight={4}
                opacity={0.8}
              />
              {routePath.length > 0 && (
                <CircleMarker
                  center={routePath[0]}
                  radius={6}
                  fillColor="hsl(142 76% 36%)"
                  fillOpacity={1}
                  color="white"
                  weight={2}
                />
              )}
              <CircleMarker
                center={center}
                radius={8}
                fillColor="hsl(var(--primary))"
                fillOpacity={1}
                color="white"
                weight={3}
              />
            </MapContainer>
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
