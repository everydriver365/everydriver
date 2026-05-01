import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type LayoutStyle = "dashboard" | "schedule" | "lockscreen" | "clean" | "ios-native" | "compact" | "bestmate" | "mission-control" | "widgets" | "premium-ios" | "premium";

export interface AppearanceSettings {
  layoutStyle: LayoutStyle;
  heroImageUrl: string | null;
  wallpaperColor: string | null;
}

const QUERY_KEY = "instructor-appearance";

const defaultAppearance: AppearanceSettings = {
  layoutStyle: "premium",
  heroImageUrl: null,
  wallpaperColor: null,
};

export function useInstructorAppearance(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: appearance = defaultAppearance, isLoading: loading } = useQuery({
    queryKey: [QUERY_KEY, instructorId],
    queryFn: async (): Promise<AppearanceSettings> => {
      if (!instructorId) return defaultAppearance;

      const { data, error } = await supabase
        .from("instructor_tile_preferences")
        .select("home_layout_style, hero_image_url, wallpaper_color")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching appearance:", error);
        return defaultAppearance;
      }

      if (data) {
        // Treat legacy blue (#E8F1FE) as null so it falls back to the new default
        const rawColor = data.wallpaper_color as string | null;
        const normalizedColor = rawColor?.toUpperCase() === "#E8F1FE" ? null : rawColor;
        return {
          layoutStyle: (data.home_layout_style as LayoutStyle) || "premium-ios",
          heroImageUrl: data.hero_image_url as string | null,
          wallpaperColor: normalizedColor,
        };
      }

      return defaultAppearance;
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5,
  });

  const updateAppearance = useCallback(
    async (changes: Partial<AppearanceSettings>) => {
      if (!instructorId) return false;

      // Optimistic update
      queryClient.setQueryData<AppearanceSettings>(
        [QUERY_KEY, instructorId],
        (prev) => ({ ...(prev || defaultAppearance), ...changes })
      );

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

        toast.success("Appearance saved");
        return true;
      } catch (error) {
        console.error("Error saving appearance:", error);
        // Revert on error
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, instructorId] });
        toast.error("Failed to save appearance");
        return false;
      }
    },
    [instructorId, queryClient]
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

        const url = `${urlData.publicUrl}?t=${Date.now()}`;
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
    saving: false,
    updateAppearance,
    uploadHeroImage,
    refetch: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, instructorId] }),
  };
}
