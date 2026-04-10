import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Video,
  Play,
  MoreVertical,
  Trash2,
  Share2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VideoClip {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  instructor_note: string | null;
  clip_type: 'general' | 'good_practice' | 'needs_work' | 'highlight';
  is_shared_with_pupil: boolean;
  created_at: string;
  duration_seconds: number | null;
}

interface VideoClipGalleryProps {
  telematicsId?: string;
  pupilId?: string;
  instructorId: string;
  className?: string;
  limit?: number;
}

const clipTypeConfig = {
  general: { icon: Video, color: 'text-muted-foreground', bg: 'bg-muted', label: 'General' },
  good_practice: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Good Practice' },
  needs_work: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Needs Work' },
  highlight: { icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', label: 'Highlight' },
};

const VideoClipGallery: React.FC<VideoClipGalleryProps> = ({
  telematicsId,
  pupilId,
  instructorId,
  className,
  limit = 10,
}) => {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const queryClient = useQueryClient();

  const { data: clips, isLoading } = useQuery({
    queryKey: ['video-clips', telematicsId, pupilId, instructorId],
    queryFn: async () => {
      let query = supabase
        .from('lesson_video_clips')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (telematicsId) {
        query = query.eq('telematics_id', telematicsId);
      }
      if (pupilId) {
        query = query.eq('pupil_id', pupilId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VideoClip[];
    },
  });

  const toggleShareMutation = useMutation({
    mutationFn: async ({ clipId, shared }: { clipId: string; shared: boolean }) => {
      const { error } = await supabase
        .from('lesson_video_clips')
        .update({ is_shared_with_pupil: shared })
        .eq('id', clipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-clips'] });
      toast({ title: 'Sharing updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (clipId: string) => {
      const { error } = await supabase
        .from('lesson_video_clips')
        .delete()
        .eq('id', clipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-clips'] });
      toast({ title: 'Clip deleted' });
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clips || clips.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No video clips yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-5 w-5 text-primary" />
            Video Clips
            <Badge variant="secondary" className="ml-auto">
              {clips.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {clips.map((clip) => {
              const config = clipTypeConfig[clip.clip_type];
              const TypeIcon = config.icon;

              return (
                <div
                  key={clip.id}
                  className="group relative aspect-video rounded-none overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setSelectedClip(clip)}
                >
                  {/* Thumbnail or Placeholder */}
                  {clip.thumbnail_url ? (
                    <img
                      src={clip.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-black ml-0.5" />
                    </div>
                  </div>

                  {/* Type Badge */}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "absolute top-2 left-2 text-[10px] gap-1",
                      config.bg,
                      config.color
                    )}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>

                  {/* Sharing Indicator */}
                  {clip.is_shared_with_pupil && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-[10px] bg-green-100 text-green-700"
                    >
                      <Share2 className="h-3 w-3" />
                    </Badge>
                  )}

                  {/* Date */}
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white/90">
                      {format(new Date(clip.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-7 w-7 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShareMutation.mutate({
                            clipId: clip.id,
                            shared: !clip.is_shared_with_pupil,
                          });
                        }}
                      >
                        {clip.is_shared_with_pupil ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide from pupil
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Share with pupil
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(clip.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Clip
            </DialogTitle>
          </DialogHeader>
          {selectedClip && (
            <div className="p-4 pt-2 space-y-4">
              <div className="aspect-video rounded-none overflow-hidden bg-black">
                <video
                  src={selectedClip.video_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              {selectedClip.instructor_note && (
                <div className="p-3 bg-muted/50 rounded-none">
                  <p className="text-sm">{selectedClip.instructor_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoClipGallery;
