import { useState, useRef } from "react";
import { Camera, Loader2, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilProfilePictureUploadProps {
  pupilId: string;
  pupilName: string;
  currentImageUrl: string | null;
  onImageUpdated: (newUrl: string | null) => void;
}

export function PupilProfilePictureUpload({
  pupilId,
  pupilName,
  currentImageUrl,
  onImageUpdated,
}: PupilProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${pupilId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("pupil-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("pupil-avatars")
        .getPublicUrl(fileName);

      const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      // Update pupil record
      const { error: updateError } = await supabase
        .from("pupils")
        .update({ profile_image_url: newUrl })
        .eq("id", pupilId);

      if (updateError) throw updateError;

      setPreviewUrl(newUrl);
      onImageUpdated(newUrl);
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from("pupil-avatars")
        .remove([`${pupilId}/avatar.jpg`, `${pupilId}/avatar.png`, `${pupilId}/avatar.jpeg`, `${pupilId}/avatar.webp`]);

      // Update pupil record
      const { error: updateError } = await supabase
        .from("pupils")
        .update({ profile_image_url: null })
        .eq("id", pupilId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onImageUpdated(null);
      toast.success("Profile picture removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={previewUrl || undefined} alt={pupilName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            {getInitials(pupilName)}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-1.5" />
          {previewUrl ? "Change Photo" : "Add Photo"}
        </Button>
        {previewUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemovePhoto}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Upload a profile picture (max 5MB)
      </p>
    </div>
  );
}
