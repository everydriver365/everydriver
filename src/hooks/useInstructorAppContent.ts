import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

export interface InstructorAppHero {
  id: string;
  badge_text: string;
  headline_part1: string;
  headline_highlight: string;
  subtext: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  demo_cta_text: string;
  demo_cta_link: string;
  trust_badge1: string;
  trust_badge2: string;
  hero_image_url: string | null;
}

export interface InstructorAppFeature {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  detailed_content: string | null;
}

export interface InstructorAppTestimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  photo_url: string | null;
  display_order: number;
}

export interface InstructorAppSection {
  id: string;
  section_key: string;
  section_name: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
}

const defaultHero: InstructorAppHero = {
  id: 'default',
  badge_text: 'Trusted by 500+ driving instructors',
  headline_part1: 'Grow Your Driving School',
  headline_highlight: 'Business',
  subtext: 'The all-in-one platform for driving instructors. Manage your diary, pupils, payments, and get your own website — all from one simple dashboard.',
  primary_cta_text: 'Start Free Trial',
  primary_cta_link: '/instructor-app/signup',
  secondary_cta_text: 'View Pricing',
  secondary_cta_link: '/instructor-app/pricing',
  demo_cta_text: 'See Demo',
  demo_cta_link: '/i/sarah-mitchell',
  trust_badge1: 'No credit card required',
  trust_badge2: 'Free plan available',
  hero_image_url: null,
};

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.Star;
};

export function useInstructorAppContent() {
  const [hero, setHero] = useState<InstructorAppHero>(defaultHero);
  const [features, setFeatures] = useState<Array<InstructorAppFeature & { icon: React.ComponentType<{ className?: string }> }>>([]);
  const [testimonials, setTestimonials] = useState<InstructorAppTestimonial[]>([]);
  const [sections, setSections] = useState<InstructorAppSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [heroRes, featuresRes, testimonialsRes, sectionsRes] = await Promise.all([
        supabase.from('instructor_app_hero').select('*').eq('is_active', true).limit(1).single(),
        supabase.from('instructor_app_features').select('*').eq('is_active', true).order('display_order'),
        supabase.from('instructor_app_testimonials').select('*').eq('is_active', true).order('display_order'),
        supabase.from('instructor_app_sections').select('*').order('display_order'),
      ]);

      if (heroRes.data) setHero(heroRes.data as InstructorAppHero);
      
      if (featuresRes.data) {
        setFeatures(featuresRes.data.map((f: InstructorAppFeature) => ({
          ...f,
          icon: getIconComponent(f.icon_name),
        })));
      }
      
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as InstructorAppTestimonial[]);
      if (sectionsRes.data) setSections(sectionsRes.data as InstructorAppSection[]);
    } catch (error) {
      console.error('Error fetching instructor app content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getSection = (key: string) => sections.find(s => s.section_key === key);
  const isSectionVisible = (key: string) => getSection(key)?.is_visible ?? true;

  return { hero, features, testimonials, sections, loading, getSection, isSectionVisible, refetch: fetchContent };
}

// Admin hook for managing content
export function useInstructorAppAdmin() {
  const [hero, setHero] = useState<InstructorAppHero | null>(null);
  const [features, setFeatures] = useState<InstructorAppFeature[]>([]);
  const [testimonials, setTestimonials] = useState<InstructorAppTestimonial[]>([]);
  const [sections, setSections] = useState<InstructorAppSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [heroRes, featuresRes, testimonialsRes, sectionsRes] = await Promise.all([
        supabase.from('instructor_app_hero').select('*').limit(1).single(),
        supabase.from('instructor_app_features').select('*').order('display_order'),
        supabase.from('instructor_app_testimonials').select('*').order('display_order'),
        supabase.from('instructor_app_sections').select('*').order('display_order'),
      ]);

      if (heroRes.data) setHero(heroRes.data as InstructorAppHero);
      if (featuresRes.data) setFeatures(featuresRes.data as InstructorAppFeature[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as InstructorAppTestimonial[]);
      if (sectionsRes.data) setSections(sectionsRes.data as InstructorAppSection[]);
    } catch (error) {
      console.error('Error fetching admin content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateHero = async (updates: Partial<InstructorAppHero>) => {
    if (!hero) return false;
    const { error } = await supabase.from('instructor_app_hero').update(updates).eq('id', hero.id);
    if (!error) await fetchAll();
    return !error;
  };

  const updateFeature = async (id: string, updates: Partial<InstructorAppFeature>) => {
    const { error } = await supabase.from('instructor_app_features').update(updates).eq('id', id);
    if (!error) await fetchAll();
    return !error;
  };

  const addFeature = async (feature: Omit<InstructorAppFeature, 'id' | 'display_order' | 'is_active'>) => {
    const maxOrder = Math.max(...features.map(f => f.display_order), 0);
    const { error } = await supabase.from('instructor_app_features').insert({ ...feature, display_order: maxOrder + 1 });
    if (!error) await fetchAll();
    return !error;
  };

  const deleteFeature = async (id: string) => {
    const { error } = await supabase.from('instructor_app_features').delete().eq('id', id);
    if (!error) await fetchAll();
    return !error;
  };

  const updateTestimonial = async (id: string, updates: Partial<InstructorAppTestimonial>) => {
    const { error } = await supabase.from('instructor_app_testimonials').update(updates).eq('id', id);
    if (!error) await fetchAll();
    return !error;
  };

  const addTestimonial = async (testimonial: Omit<InstructorAppTestimonial, 'id' | 'display_order'>) => {
    const maxOrder = Math.max(...testimonials.map(t => t.display_order), 0);
    const { error } = await supabase.from('instructor_app_testimonials').insert({ ...testimonial, display_order: maxOrder + 1 });
    if (!error) await fetchAll();
    return !error;
  };

  const deleteTestimonial = async (id: string) => {
    const { error } = await supabase.from('instructor_app_testimonials').delete().eq('id', id);
    if (!error) await fetchAll();
    return !error;
  };

  const updateSection = async (id: string, updates: Partial<InstructorAppSection>) => {
    const { error } = await supabase.from('instructor_app_sections').update(updates).eq('id', id);
    if (!error) await fetchAll();
    return !error;
  };

  return {
    hero, features, testimonials, sections, loading,
    updateHero, updateFeature, addFeature, deleteFeature,
    updateTestimonial, addTestimonial, deleteTestimonial,
    updateSection, refetch: fetchAll,
  };
}
