import { Gauge, MapPin, Clock, Route, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GpsPoint, RouteData } from "@/hooks/useTripReplay";
import { kmToMiles, kmhToMph } from "@/lib/utils";

interface TripReplayStatsProps {
  route: RouteData | null;
  currentPoint: GpsPoint | null;
  speedStats: {
    avg: number;
    max: number;
    current: number;
    limit: number | null;
  } | null;
  totalSeconds: number;
  elapsedSeconds: number;
}

export function TripReplayStats({
  route,
  currentPoint,
  speedStats,
  totalSeconds,
  elapsedSeconds,
}: TripReplayStatsProps) {
  const isSpeeding = speedStats?.limit && speedStats.current > speedStats.limit;

  return (
    <div className="space-y-3">
      {/* Current Speed Panel */}
      <Card className={isSpeeding ? "border-destructive/50 bg-destructive/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold tabular-nums ${isSpeeding ? "text-destructive" : ""}`}>
                  {Math.round(kmhToMph(speedStats?.current || 0))}
                </div>
                <div className="text-xs text-muted-foreground">mph</div>
              </div>
              {speedStats?.limit && (
                <div className="text-center">
                  <div className="text-xl font-semibold text-muted-foreground tabular-nums">
                    {Math.round(kmhToMph(speedStats.limit))}
                  </div>
                  <div className="text-xs text-muted-foreground">limit</div>
                </div>
              )}
            </div>
            <div className="text-right">
              {currentPoint?.road_name ? (
                <div className="text-sm font-medium truncate max-w-40">
                  {currentPoint.road_name}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Unknown road</div>
              )}
              {isSpeeding && (
                <Badge variant="destructive" className="mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Speeding
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <Route className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-sm font-semibold">
              {route?.distance_km ? kmToMiles(route.distance_km).toFixed(1) : "—"} mi
            </div>
            <div className="text-[10px] text-muted-foreground">Distance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-sm font-semibold">
              {route?.duration_minutes || Math.round(totalSeconds / 60)} min
            </div>
            <div className="text-[10px] text-muted-foreground">Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gauge className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-sm font-semibold">
              {Math.round(kmhToMph(speedStats?.avg || 0))} mph
            </div>
            <div className="text-[10px] text-muted-foreground">Avg Speed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-sm font-semibold">
              {Math.round(kmhToMph(speedStats?.max || 0))} mph
            </div>
            <div className="text-[10px] text-muted-foreground">Max Speed</div>
          </CardContent>
        </Card>
      </div>

      {/* Route Info */}
      {route && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{route.name}</div>
                {route.pupil?.name && (
                  <div className="text-xs text-muted-foreground">
                    with {route.pupil.name}
                  </div>
                )}
              </div>
              <div className="text-right">
                {route.start_location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-24">{route.start_location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
