import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video, Loader2, X, Upload, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUploadFieldProps {
  label: string;
  value: string | null;
  instructorId: string;
  folder: string;
  onChange: (url: string | null) => void;
  helpText?: string;
  maxSizeMB?: number;
}

export function VideoUploadField({
  label,
  value,
  instructorId,
  folder,
  onChange,
  helpText,
  maxSizeMB = 50,
}: VideoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Video must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/${folder}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("course-videos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("course-videos")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
      toast.success(`${label} uploaded!`);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(`Failed to upload ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        {label}
      </Label>
      
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-lg border-2 border-dashed overflow-hidden bg-muted/50 aspect-video w-full max-w-sm flex items-center justify-center">
          {value ? (
            <>
              <video
                src={value}
                className="w-full h-full object-cover"
                controls
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <div className="text-center p-6">
              {uploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
              ) : (
                <>
                  <Play className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload a welcome video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {maxSizeMB}MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span>
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {value ? "Change" : "Upload"} Video
            </span>
          </Button>
        </label>
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground text-center">{helpText}</p>
      )}
    </div>
  );
}
