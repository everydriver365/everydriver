import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTripReplay } from "@/hooks/useTripReplay";
import { TripReplayMap } from "@/components/instructor/trip-replay/TripReplayMap";
import { TripReplayControls } from "@/components/instructor/trip-replay/TripReplayControls";
import { TripReplaySpeedChart } from "@/components/instructor/trip-replay/TripReplaySpeedChart";
import { TripReplayStats } from "@/components/instructor/trip-replay/TripReplayStats";

export default function InstructorTripReplay() {
  const { routeId } = useParams<{ routeId: string }>();
  const [searchParams] = useSearchParams();
  const telematicsId = searchParams.get("session");
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/instructor/telematics");
  };

  const {
    route,
    gpsPoints,
    currentPoint,
    bounds,
    speedStats,
    isLoading,
    error,
    state,
    togglePlayPause,
    restart,
    seekToProgress,
    seekToIndex,
    setPlaybackSpeed,
  } = useTripReplay({ routeId, telematicsId: telematicsId || undefined });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Trip Replay</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              onClick={goBack}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold truncate max-w-48">
                {route?.name || "Trip Replay"}
              </h1>
              {route?.created_at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(route.created_at).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Map */}
        <div className="h-64 rounded-lg overflow-hidden border">
          <TripReplayMap
            gpsPoints={gpsPoints}
            currentIndex={state.currentIndex}
            bounds={bounds}
          />
        </div>

        {/* Playback Controls */}
        <TripReplayControls
          state={state}
          onPlayPause={togglePlayPause}
          onRestart={restart}
          onSeek={seekToProgress}
          onSpeedChange={setPlaybackSpeed}
        />

        {/* Speed Chart */}
        <div className="p-4 bg-card border rounded-lg">
          <h3 className="text-sm font-medium mb-2">Speed Timeline</h3>
          <TripReplaySpeedChart
            gpsPoints={gpsPoints}
            currentIndex={state.currentIndex}
            onPointClick={seekToIndex}
          />
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span>Speed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-destructive/50 rounded" style={{ borderStyle: "dashed" }} />
              <span>Limit</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <TripReplayStats
          route={route}
          currentPoint={currentPoint}
          speedStats={speedStats}
          totalSeconds={state.totalSeconds}
          elapsedSeconds={state.elapsedSeconds}
        />
      </div>
    </div>
  );
}
