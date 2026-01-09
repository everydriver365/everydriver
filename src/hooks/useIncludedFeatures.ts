import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

export interface IncludedFeature {
  id: string;
  title: string;
  description: string;
  detailed_content: string | null;
  icon_name: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface IncludedFeatureData {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  detailed_content: string | null;
  image_url: string | null;
}

// Get icon component by name with type safety
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || LucideIcons.Star;
};

export function useIncludedFeatures() {
  const [features, setFeatures] = useState<IncludedFeatureData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('included_features')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;

        const mappedFeatures = (data || []).map((feature: IncludedFeature) => ({
          id: feature.id,
          icon: getIconComponent(feature.icon_name),
          title: feature.title,
          description: feature.description,
          detailed_content: feature.detailed_content,
          image_url: feature.image_url,
        }));

        setFeatures(mappedFeatures);
      } catch (error) {
        console.error('Error fetching included features:', error);
        // Return empty array on error - will show fallback in UI
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return { features, loading };
}
