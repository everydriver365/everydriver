import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useState, useRef } from "react";

interface VoiceNoteRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

export function VoiceNoteRecorder({ onRecorded, disabled }: VoiceNoteRecorderProps) {
  const { isRecording, duration, audioUrl, startRecording, stopRecording, resetRecording, isSupported } =
    useAudioRecorder();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isSupported) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob) onRecorded(blob);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDelete = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    resetRecording();
  };

  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-none bg-muted/50 border border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlayback}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-primary/20">
            <div className="h-full rounded-full bg-primary w-full" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{formatTime(duration)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-none bg-destructive/10 border border-destructive/20">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-destructive">Recording</span>
        <span className="text-xs text-destructive/70 tabular-nums ml-auto mr-2">{formatTime(duration)}</span>
        <Button variant="outline" size="sm" className="h-7 gap-1" onClick={handleStop}>
          <Square className="h-3 w-3" /> Stop
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={startRecording}
      disabled={disabled}
    >
      <Mic className="h-3.5 w-3.5" />
      Record Voice Note
    </Button>
  );
}
