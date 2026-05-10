import { useEffect, useState } from "react";
import { Loader2, Car as CarIcon, Video, Award, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast as uiToast } from "@/hooks/use-toast";
import { CMSImageUpload } from "@/components/admin/CMSImageUpload";

interface MediaRow {
  hero_image_url: string | null;
  car_image_url: string | null;
  welcome_video_url: string | null;
  adi_certificate_url: string | null;
}

interface Props {
  instructorId: string;
}

export function ProfileMediaEditor({ instructorId }: Props) {
  const [row, setRow] = useState<MediaRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("hero_image_url, car_image_url, welcome_video_url, adi_certificate_url")
        .eq("id", instructorId)
        .single();
      if (data) setRow(data as MediaRow);
      setLoading(false);
    })();
  }, [instructorId]);

  const updateField = async (field: keyof MediaRow, value: string | null) => {
    const { error } = await supabase
      .from("instructors")
      .update({ [field]: value })
      .eq("id", instructorId);
    if (!error) setRow(p => (p ? { ...p, [field]: value } : null));
    uiToast({ title: error ? "Error" : "Saved", variant: error ? "destructive" : undefined });
  };

  if (loading || !row) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Banner image</Label>
        </div>
        <CMSImageUpload
          value={row.hero_image_url || null}
          onChange={(url) => updateField("hero_image_url", url)}
          bucket="instructor-images"
          folder={instructorId}
          label=""
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CarIcon className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Car photo</Label>
        </div>
        <CMSImageUpload
          value={row.car_image_url || null}
          onChange={(url) => updateField("car_image_url", url)}
          bucket="instructor-images"
          folder={instructorId}
          label=""
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Welcome video URL</Label>
        </div>
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={row.welcome_video_url || ""}
          onChange={e => setRow(p => (p ? { ...p, welcome_video_url: e.target.value } : null))}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateField("welcome_video_url", row.welcome_video_url ?? null)}
        >
          Save video URL
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">ADI certificate</Label>
        </div>
        <CMSImageUpload
          value={row.adi_certificate_url || null}
          onChange={(url) => updateField("adi_certificate_url", url)}
          bucket="instructor-images"
          folder={instructorId}
          label=""
        />
      </div>
    </div>
  );
}
