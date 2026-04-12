import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Video,
  Upload,
  X,
  Check,
  Loader2,
  Film,
  Share2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VideoClipUploaderProps {
  telematicsId?: string;
  instructorId: string;
  pupilId?: string;
  onSuccess?: (clipId: string) => void;
  onCancel?: () => void;
  className?: string;
}

type ClipType = 'general' | 'good_practice' | 'needs_work' | 'highlight';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const VideoClipUploader: React.FC<VideoClipUploaderProps> = ({
  telematicsId,
  instructorId,
  pupilId,
  onSuccess,
  onCancel,
  className,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [note, setNote] = useState('');
  const [clipType, setClipType] = useState<ClipType>('general');
  const [shareWithPupil, setShareWithPupil] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an MP4, MOV, or WebM video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Video must be under 100MB. Try compressing it first.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const clipId = crypto.randomUUID();
      const fileExt = file.name.split('.').pop();
      const date = new Date().toISOString().split('T')[0];
      const filePath = `${instructorId}/clips/${date}/${clipId}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Simulate progress (real progress tracking requires custom XHR)
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((r) => setTimeout(r, 100));
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson-videos')
        .getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase
        .from('lesson_video_clips')
        .insert({
          id: clipId,
          telematics_id: telematicsId || null,
          instructor_id: instructorId,
          pupil_id: pupilId || null,
          video_url: urlData.publicUrl,
          instructor_note: note || null,
          clip_type: clipType,
          is_shared_with_pupil: shareWithPupil,
          duration_seconds: null, // Could extract from video metadata
        });

      if (dbError) throw dbError;

      toast({
        title: 'Video Uploaded!',
        description: 'Your clip has been saved successfully.',
      });

      onSuccess?.(clipId);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unable to upload video.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-5 w-5 text-primary" />
          Upload Video Clip
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Input Area */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Select video to upload</p>
            <p className="text-sm text-muted-foreground">
              MP4, MOV, or WebM • Max 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Film className="h-4 w-4" />
              <span className="truncate flex-1">{file.name}</span>
              <Badge variant="secondary">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </Badge>
            </div>

            {/* Clip Type */}
            <div className="space-y-2">
              <Label>Clip Type</Label>
              <Select value={clipType} onValueChange={(v) => setClipType(v as ClipType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="good_practice">Good Practice</SelectItem>
                  <SelectItem value="needs_work">Needs Work</SelectItem>
                  <SelectItem value="highlight">Highlight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this clip..."
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Share with Pupil */}
            {pupilId && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="share-pupil" className="cursor-pointer">
                    Share with pupil
                  </Label>
                </div>
                <Switch
                  id="share-pupil"
                  checked={shareWithPupil}
                  onCheckedChange={setShareWithPupil}
                />
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Upload Clip
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoClipUploader;
