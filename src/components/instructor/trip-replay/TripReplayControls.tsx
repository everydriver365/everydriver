import { Play, Pause, RotateCcw, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripReplayState } from "@/hooks/useTripReplay";

interface TripReplayControlsProps {
  state: TripReplayState;
  onPlayPause: () => void;
  onRestart: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TripReplayControls({
  state,
  onPlayPause,
  onRestart,
  onSeek,
  onSpeedChange,
}: TripReplayControlsProps) {
  return (
    <div className="space-y-3 p-4 bg-card border rounded-2xl">
      {/* Progress bar */}
      <div className="space-y-2">
        <Slider
          value={[state.progress]}
          onValueChange={([value]) => onSeek(value)}
          max={100}
          step={0.1}
          className="w-full"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(state.elapsedSeconds)}</span>
          <span>{formatTime(state.totalSeconds)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRestart}
            className="h-9 w-9"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10"
          >
            {state.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <Select
            value={String(state.playbackSpeed)}
            onValueChange={(value) => onSpeedChange(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="4">4x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
