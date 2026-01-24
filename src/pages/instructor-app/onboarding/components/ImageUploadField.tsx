import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  instructorId: string;
  folder: string;
  onChange: (url: string | null) => void;
  aspectRatio?: "square" | "video" | "badge";
  placeholder?: string;
  helpText?: string;
}

export function ImageUploadField({
  label,
  value,
  instructorId,
  folder,
  onChange,
  aspectRatio = "square",
  placeholder,
  helpText,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const aspectClasses = {
    square: "aspect-square w-32",
    video: "aspect-video w-full max-w-xs",
    badge: "aspect-[3/4] w-24",
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/${folder}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("instructor-images")
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
      <Label>{label}</Label>
      
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed overflow-hidden bg-muted/50 flex items-center justify-center",
            aspectClasses[aspectRatio],
            value ? "border-primary" : "border-border"
          )}
        >
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <div className="text-center p-4">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {placeholder || "Click to upload"}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
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
                <Camera className="h-4 w-4 mr-2" />
              )}
              {value ? "Change" : "Upload"} {label}
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
