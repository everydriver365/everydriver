import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageHero {
  id: string;
  badge_text: string;
  headline_line1: string;
  headline_line2: string;
  headline_highlight: string;
  headline_line3: string;
  subtext: string;
  search_placeholder: string;
  search_button_text: string;
  rating_value: string;
  learners_count: string;
  learners_label: string;
}

const defaultHero: HomepageHero = {
  id: 'default',
  badge_text: 'Free Re-test',
  headline_line1: 'Your Driving',
  headline_line2: 'Success',
  headline_highlight: 'Story',
  headline_line3: 'Starts Here',
  subtext: 'Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster.',
  search_placeholder: 'Enter your postcode...',
  search_button_text: 'Find Courses',
  rating_value: '4.9',
  learners_count: '10k+',
  learners_label: 'Learners',
};

export function useHomepageHero() {
  const [hero, setHero] = useState<HomepageHero>(defaultHero);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('homepage_hero')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setHero(data as HomepageHero);
        }
      } catch (error) {
        console.error('Error fetching homepage hero:', error);
        setHero(defaultHero);
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, []);

  return { hero, loading };
}
