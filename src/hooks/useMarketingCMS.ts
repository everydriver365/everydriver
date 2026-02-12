import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketingPage {
  id: string;
  page_key: string;
  page_title: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingSection {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  image_url: string | null;
  video_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function useMarketingCMS() {
  const [pages, setPages] = useState<MarketingPage[]>([]);
  const [sections, setSections] = useState<MarketingSection[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_pages')
      .select('*')
      .order('page_title');
    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }
    setPages((data || []) as MarketingPage[]);
    if (!selectedPageId && data && data.length > 0) {
      setSelectedPageId(data[0].id);
    }
  }, [selectedPageId]);

  const fetchSections = useCallback(async (pageId: string) => {
    const { data, error } = await supabase
      .from('marketing_page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order');
    if (error) {
      console.error('Error fetching sections:', error);
      return;
    }
    setSections((data || []) as MarketingSection[]);
  }, []);

  useEffect(() => {
    fetchPages().finally(() => setLoading(false));
  }, [fetchPages]);

  useEffect(() => {
    if (selectedPageId) {
      fetchSections(selectedPageId);
    }
  }, [selectedPageId, fetchSections]);

  const updatePage = async (id: string, updates: Partial<MarketingPage>) => {
    const { error } = await supabase
      .from('marketing_pages')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update page');
      return false;
    }
    await fetchPages();
    return true;
  };

  const addSection = async (pageId: string, section: Partial<MarketingSection>) => {
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.display_order)) + 1 : 0;
    const { error } = await supabase
      .from('marketing_page_sections')
      .insert({
        page_id: pageId,
        section_key: section.section_key || `section_${Date.now()}`,
        section_type: section.section_type || 'content',
        title: section.title || 'New Section',
        subtitle: section.subtitle || null,
        content: section.content || {},
        image_url: section.image_url || null,
        video_url: section.video_url || null,
        display_order: maxOrder,
        is_visible: true,
      });
    if (error) {
      toast.error('Failed to add section');
      return false;
    }
    await fetchSections(pageId);
    return true;
  };

  const updateSection = async (id: string, updates: Partial<MarketingSection>) => {
    const { error } = await supabase
      .from('marketing_page_sections')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update section');
      return false;
    }
    if (selectedPageId) await fetchSections(selectedPageId);
    return true;
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('marketing_page_sections')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete section');
      return false;
    }
    if (selectedPageId) await fetchSections(selectedPageId);
    return true;
  };

  const reorderSections = async (reordered: MarketingSection[]) => {
    setSections(reordered);
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from('marketing_page_sections')
        .update({ display_order: i })
        .eq('id', reordered[i].id);
    }
  };

  return {
    pages,
    sections,
    selectedPageId,
    setSelectedPageId,
    loading,
    updatePage,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    refreshSections: () => selectedPageId ? fetchSections(selectedPageId) : Promise.resolve(),
  };
}
