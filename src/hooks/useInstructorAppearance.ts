import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LayoutStyle = "dashboard" | "schedule";

export interface AppearanceSettings {
  layoutStyle: LayoutStyle;
  heroImageUrl: string | null;
  wallpaperColor: string | null;
}

export function useInstructorAppearance(instructorId: string | undefined) {
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    layoutStyle: "dashboard",
    heroImageUrl: null,
    wallpaperColor: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAppearance = useCallback(async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("instructor_tile_preferences")
        .select("home_layout_style, hero_image_url, wallpaper_color")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching appearance:", error);
      } else if (data) {
        setAppearance({
          layoutStyle: (data.home_layout_style as LayoutStyle) || "dashboard",
          heroImageUrl: data.hero_image_url as string | null,
          wallpaperColor: data.wallpaper_color as string | null,
        });
      }
    } catch (error) {
      console.error("Error fetching appearance:", error);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchAppearance();
  }, [fetchAppearance]);

  const updateAppearance = useCallback(
    async (changes: Partial<AppearanceSettings>) => {
      if (!instructorId) return false;

      setSaving(true);
      try {
        const dbChanges: Record<string, unknown> = {
          instructor_id: instructorId,
          updated_at: new Date().toISOString(),
        };

        if (changes.layoutStyle !== undefined)
          dbChanges.home_layout_style = changes.layoutStyle;
        if (changes.heroImageUrl !== undefined)
          dbChanges.hero_image_url = changes.heroImageUrl;
        if (changes.wallpaperColor !== undefined)
          dbChanges.wallpaper_color = changes.wallpaperColor;

        const { error } = await supabase
          .from("instructor_tile_preferences")
          .upsert(dbChanges as any, { onConflict: "instructor_id" });

        if (error) throw error;

        setAppearance((prev) => ({ ...prev, ...changes }));
        toast.success("Appearance saved");
        return true;
      } catch (error) {
        console.error("Error saving appearance:", error);
        toast.error("Failed to save appearance");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [instructorId]
  );

  const uploadHeroImage = useCallback(
    async (file: File) => {
      if (!instructorId) return null;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return null;
      }

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${instructorId}/hero.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("hero-images")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("hero-images")
          .getPublicUrl(fileName);

        const url = urlData.publicUrl;
        await updateAppearance({ heroImageUrl: url });
        return url;
      } catch (err) {
        console.error("Hero upload failed:", err);
        toast.error("Failed to upload hero image");
        return null;
      }
    },
    [instructorId, updateAppearance]
  );

  return {
    ...appearance,
    loading,
    saving,
    updateAppearance,
    uploadHeroImage,
    refetch: fetchAppearance,
  };
}
