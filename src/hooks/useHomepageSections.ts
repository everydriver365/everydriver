import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  is_visible: boolean;
  display_order: number;
}

export function useHomepageSections() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSections((data || []) as HomepageSection[]);
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const getSection = (key: string): HomepageSection | undefined => {
    return sections.find(s => s.section_key === key);
  };

  const isVisible = (key: string): boolean => {
    const section = getSection(key);
    return section?.is_visible ?? true;
  };

  const updateSection = async (id: string, updates: Partial<HomepageSection>) => {
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchSections();
      return true;
    } catch (error) {
      console.error('Error updating section:', error);
      return false;
    }
  };

  return { sections, loading, getSection, isVisible, updateSection, refetch: fetchSections };
}
