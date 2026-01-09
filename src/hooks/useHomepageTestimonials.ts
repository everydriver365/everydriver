import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageTestimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_initials: string | null;
  image_key: string | null;
  course_type: string | null;
  is_featured: boolean;
  display_order: number;
}

export function useHomepageTestimonials() {
  const [testimonials, setTestimonials] = useState<HomepageTestimonial[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<HomepageTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('homepage_testimonials')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;

        const allTestimonials = (data || []) as HomepageTestimonial[];
        setTestimonials(allTestimonials);
        setFeaturedTestimonials(allTestimonials.filter(t => t.is_featured));
      } catch (error) {
        console.error('Error fetching homepage testimonials:', error);
        // Fallback to defaults
        const defaultTestimonials: HomepageTestimonial[] = [
          { id: '1', name: 'Sarah', role: 'Passed First Time', content: 'Passed 1st time! ✨', avatar_initials: 'S', image_key: 'testimonial_sarah', course_type: 'Intensive', is_featured: true, display_order: 1 },
          { id: '2', name: 'James', role: 'Intensive Course', content: 'Intensive Course 🚗', avatar_initials: 'J', image_key: 'testimonial_james', course_type: 'Intensive', is_featured: true, display_order: 2 },
          { id: '3', name: 'Emma', role: 'Weekly Lessons', content: 'Weekly Lessons 💪', avatar_initials: 'E', image_key: 'testimonial_emma', course_type: 'Weekly', is_featured: true, display_order: 3 },
          { id: '4', name: 'Priya', role: 'Semi-Intensive', content: 'Semi-Intensive 🎉', avatar_initials: 'P', image_key: 'testimonial_priya', course_type: 'Semi-Intensive', is_featured: true, display_order: 4 },
        ];
        setTestimonials(defaultTestimonials);
        setFeaturedTestimonials(defaultTestimonials.filter(t => t.is_featured));
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return { testimonials, featuredTestimonials, loading };
}
