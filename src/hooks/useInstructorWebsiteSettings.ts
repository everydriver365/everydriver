import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorWebsiteSettings {
  id?: string;
  instructor_id: string;
  site_tagline: string | null;
  default_meta_description: string | null;
  default_keywords: string | null;
  default_og_image_url: string | null;
  social_links?: Record<string, string> | null;
  google_analytics_id: string | null;
  google_site_verification: string | null;
  robots_indexable: boolean;
  custom_head_html?: string | null;
}

export function useInstructorWebsiteSettings(instructorId: string | undefined) {
  const [settings, setSettings] = useState<InstructorWebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("instructor_website_settings")
      .select("*")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    setSettings(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  const save = async (next: Partial<InstructorWebsiteSettings>): Promise<boolean> => {
    if (!instructorId) return false;
    const payload = { ...next, instructor_id: instructorId };
    const { error } = await (supabase as any)
      .from("instructor_website_settings")
      .upsert(payload, { onConflict: "instructor_id" });
    if (error) {
      console.error("[website-settings] save failed:", error);
      return false;
    }
    await fetchSettings();
    return true;
  };

  return { settings, loading, save, refetch: fetchSettings };
}
