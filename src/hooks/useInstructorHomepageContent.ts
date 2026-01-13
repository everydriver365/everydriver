import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  route: string;
  display_order: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link: string;
}

export interface InstructorHomepageContent {
  id: string;
  hero_image_url: string | null;
  motivation_title: string;
  motivation_subtitle: string;
  show_progress_indicator: boolean;
  progress_label: string;
  quick_actions: QuickAction[];
  promo_banners: PromoBanner[];
  secondary_promo_banners: PromoBanner[];
}

export function useInstructorHomepageContent() {
  const [content, setContent] = useState<InstructorHomepageContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("instructor_homepage_content")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) throw error;
      
      setContent({
        ...data,
        quick_actions: (data.quick_actions as unknown as QuickAction[]) || [],
        promo_banners: (data.promo_banners as unknown as PromoBanner[]) || [],
        secondary_promo_banners: (data.secondary_promo_banners as unknown as PromoBanner[]) || []
      });
    } catch (error) {
      console.error("Error fetching instructor homepage content:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (updates: Partial<InstructorHomepageContent>) => {
    if (!content?.id) return false;
    
    try {
      const { error } = await supabase
        .from("instructor_homepage_content")
        .update({
          ...updates,
          quick_actions: updates.quick_actions as unknown as any,
          promo_banners: updates.promo_banners as unknown as any,
          secondary_promo_banners: updates.secondary_promo_banners as unknown as any
        })
        .eq("id", content.id);

      if (error) throw error;
      await fetchContent();
      return true;
    } catch (error) {
      console.error("Error updating instructor homepage content:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return { content, loading, refetch: fetchContent, updateContent };
}
