import { useState, useEffect } from "react";
import { Upload, X, Video, Save, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteVideo {
  id: string;
  video_key: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
}

export function SiteVideoManager() {
  const [videos, setVideos] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // For now, we'll use a single "welcome_video" that can be managed
  const [welcomeVideo, setWelcomeVideo] = useState<{
    video_url: string;
    thumbnail_url: string;
    title: string;
  }>({
    video_url: "",
    thumbnail_url: "",
    title: "Our Story - Welcome Video",
  });

  useEffect(() => {
    fetchVideoSettings();
  }, []);

  const fetchVideoSettings = async () => {
    setLoading(true);
    
    // Fetch video thumbnail from site_images
    const { data: thumbnailData } = await supabase
      .from("site_images")
      .select("*")
      .eq("image_key", "video_thumbnail")
      .maybeSingle();

    // Fetch welcome video URL from site_images (we'll store it there with a video category)
    const { data: videoData } = await supabase
      .from("site_images")
      .select("*")
      .eq("image_key", "welcome_video")
      .maybeSingle();

    setWelcomeVideo({
      video_url: videoData?.image_url || "",
      thumbnail_url: thumbnailData?.image_url || "",
      title: videoData?.alt_text || "Our Story - Welcome Video",
    });

    setLoading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `welcome-video-${Date.now()}.${fileExt}`;
    const filePath = `site-videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload video");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("course-videos")
      .getPublicUrl(filePath);

    // Save or update in site_images
    const { data: existing } = await supabase
      .from("site_images")
      .select("id")
      .eq("image_key", "welcome_video")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_images")
        .update({ image_url: urlData.publicUrl })
        .eq("id", existing.id);
    } else {
      await supabase.from("site_images").insert({
        image_key: "welcome_video",
        image_url: urlData.publicUrl,
        alt_text: "Our Story - Welcome Video",
        description: "Homepage welcome/intro video",
        category: "video",
      });
    }

    setWelcomeVideo((prev) => ({ ...prev, video_url: urlData.publicUrl }));
    toast.success("Video uploaded successfully");
    setUploading(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingThumbnail(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `video-thumbnail-${Date.now()}.${fileExt}`;
    const filePath = `site-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload thumbnail");
      setUploadingThumbnail(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(filePath);

    // Update in site_images
    const { data: existing } = await supabase
      .from("site_images")
      .select("id")
      .eq("image_key", "video_thumbnail")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_images")
        .update({ image_url: urlData.publicUrl })
        .eq("id", existing.id);
    } else {
      await supabase.from("site_images").insert({
        image_key: "video_thumbnail",
        image_url: urlData.publicUrl,
        alt_text: "Video Thumbnail",
        description: "Thumbnail for the homepage welcome video",
        category: "video",
      });
    }

    setWelcomeVideo((prev) => ({ ...prev, thumbnail_url: urlData.publicUrl }));
    toast.success("Thumbnail uploaded successfully");
    setUploadingThumbnail(false);
  };

  const handleSaveTitle = async () => {
    const { data: existing } = await supabase
      .from("site_images")
      .select("id")
      .eq("image_key", "welcome_video")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_images")
        .update({ alt_text: welcomeVideo.title })
        .eq("id", existing.id);
      toast.success("Title saved");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Site Videos</h2>
        <p className="text-sm text-muted-foreground">
          Manage the welcome video and thumbnail displayed on the homepage
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Video Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video Thumbnail</CardTitle>
            <CardDescription>
              The preview image shown before the video plays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                {welcomeVideo.thumbnail_url ? (
                  <>
                    <img
                      src={welcomeVideo.thumbnail_url}
                      alt="Video thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() =>
                        setWelcomeVideo((prev) => ({ ...prev, thumbnail_url: "" }))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingThumbnail ? "Uploading..." : "Click to upload thumbnail"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumbnail}
                    />
                  </label>
                )}
              </div>
              {welcomeVideo.thumbnail_url && (
                <label className="block">
                  <Button variant="outline" className="w-full" asChild>
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingThumbnail ? "Uploading..." : "Replace Thumbnail"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                        disabled={uploadingThumbnail}
                      />
                    </span>
                  </Button>
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Welcome Video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome Video</CardTitle>
            <CardDescription>
              The main video that plays on the homepage (max 100MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                {welcomeVideo.video_url ? (
                  <>
                    <video
                      src={welcomeVideo.video_url}
                      className="h-full w-full object-cover"
                      controls
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() =>
                        setWelcomeVideo((prev) => ({ ...prev, video_url: "" }))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4">
                    <Video className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      {uploading ? "Uploading..." : "Click to upload video (MP4, WebM)"}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {welcomeVideo.video_url && (
                <label className="block">
                  <Button variant="outline" className="w-full" asChild>
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Replace Video"}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                    </span>
                  </Button>
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Video Title</CardTitle>
          <CardDescription>
            The title displayed below the video on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={welcomeVideo.title}
              onChange={(e) =>
                setWelcomeVideo((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter video title"
            />
            <Button onClick={handleSaveTitle}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
