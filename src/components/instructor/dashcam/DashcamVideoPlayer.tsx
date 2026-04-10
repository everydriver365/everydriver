import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Loader2, AlertCircle, Volume2, VolumeX } from "lucide-react";

interface DashcamVideoPlayerProps {
  mediaId: string;
  thumbnailUrl?: string | null;
  className?: string;
}

export function DashcamVideoPlayer({ mediaId, thumbnailUrl, className = "" }: DashcamVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadVideo = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geotab-media-download?mediaId=${mediaId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      if (res.redirected) {
        setVideoUrl(res.url);
      } else {
        const data = await res.json();
        if (data.downloadUrl) {
          setVideoUrl(data.downloadUrl);
        } else {
          throw new Error("No video URL returned");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`aspect-video bg-muted rounded-none flex flex-col items-center justify-center gap-2 ${className}`}>
        <AlertCircle className="h-8 w-8 text-destructive/50" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={loadVideo}>Retry</Button>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className={`relative aspect-video bg-black rounded-none overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          muted={muted}
          className="w-full h-full object-contain"
          onError={() => setError("Video playback failed")}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => {
            setMuted(!muted);
            if (videoRef.current) videoRef.current.muted = !muted;
          }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`aspect-video bg-muted rounded-none flex items-center justify-center cursor-pointer group relative overflow-hidden ${className}`}
      onClick={loadVideo}
    >
      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-foreground ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
