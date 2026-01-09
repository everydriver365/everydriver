import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

interface HomepageStat {
  id: string;
  stat_value: string;
  stat_label: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

// Get icon component by name with type safety
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || LucideIcons.Award;
};

export function useHomepageStats() {
  const [stats, setStats] = useState<Array<{
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('homepage_stats')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;

        const mappedStats = (data || []).map((stat: HomepageStat) => ({
          icon: getIconComponent(stat.icon_name),
          value: stat.stat_value,
          label: stat.stat_label,
        }));

        setStats(mappedStats);
      } catch (error) {
        console.error('Error fetching homepage stats:', error);
        // Fallback to defaults
        setStats([
          { icon: LucideIcons.GraduationCap, value: "15,000+", label: "Students Passed" },
          { icon: LucideIcons.Award, value: "98%", label: "Pass Rate" },
          { icon: LucideIcons.Users, value: "500+", label: "Instructors" },
          { icon: LucideIcons.Clock, value: "24/7", label: "Online Booking" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
