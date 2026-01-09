import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

interface HomepageFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

// Get icon component by name with type safety
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

export function useHomepageFeatures() {
  const [features, setFeatures] = useState<Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('homepage_features')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;

        const mappedFeatures = (data || []).map((feature: HomepageFeature) => ({
          icon: getIconComponent(feature.icon_name),
          title: feature.title,
          description: feature.description,
        }));

        setFeatures(mappedFeatures);
      } catch (error) {
        console.error('Error fetching homepage features:', error);
        // Fallback to defaults
        setFeatures([
          {
            icon: LucideIcons.Calendar,
            title: "Live Availability",
            description: "See real-time availability synced with Google Calendar. Book lessons that fit your schedule.",
          },
          {
            icon: LucideIcons.MapPin,
            title: "Local Instructors",
            description: "Find certified instructors near you. Search by postcode and set your preferred radius.",
          },
          {
            icon: LucideIcons.Award,
            title: "Track Progress",
            description: "Monitor your learning journey with detailed progress reports and skill assessments.",
          },
          {
            icon: LucideIcons.Users,
            title: "Parent Visibility",
            description: "Parents can track lessons, progress, and payments through a dedicated portal.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return { features, loading };
}
