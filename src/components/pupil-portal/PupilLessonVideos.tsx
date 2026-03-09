import { useState, useEffect } from "react";
import { Video, Play, Calendar, Clock, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LessonVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  duration_seconds: number | null;
  created_at: string;
  lesson_date: string | null;
}

interface PupilLessonVideosProps {
  pupilId: string;
  brandColour?: string | null;
}

export function PupilLessonVideos({ pupilId, brandColour }: PupilLessonVideosProps) {
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      // Try lesson_videos table
      const { data, error } = await (supabase.from("lesson_videos" as any) as any)
        .select("*")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setVideos(data as LessonVideo[]);
      }
      setLoading(false);
    };
    fetchVideos();
  }, [pupilId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Loading videos...
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="px-4 space-y-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No lesson videos yet</p>
            <p className="text-xs mt-1">Videos from your lessons will appear here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Video className="h-4 w-4" style={{ color: brandColour || undefined }} />
          Lesson Videos
        </h3>
        <Badge variant="secondary" className="text-xs">
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="space-y-3">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <CardContent className="p-0">
              {playingId === video.id ? (
                <video
                  src={video.video_url}
                  controls
                  autoPlay
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <button
                  onClick={() => setPlayingId(video.id)}
                  className="relative w-full aspect-video bg-muted flex items-center justify-center group"
                >
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center bg-white/90 shadow-lg"
                    >
                      <Play className="h-6 w-6 ml-0.5" style={{ color: brandColour || "hsl(var(--primary))" }} />
                    </div>
                  </div>
                </button>
              )}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {video.title || "Lesson Video"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(video.lesson_date || video.created_at), "EEE, d MMM yyyy")}
                  </p>
                </div>
                {video.duration_seconds && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, "0")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
