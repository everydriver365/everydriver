-- Create homepage_sections table for managing section content and visibility
CREATE TABLE public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  section_name text NOT NULL,
  title text NOT NULL,
  subtitle text,
  badge_text text,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Homepage sections are publicly viewable" 
ON public.homepage_sections FOR SELECT USING (true);

CREATE POLICY "Admins can manage homepage sections" 
ON public.homepage_sections FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections matching current homepage
INSERT INTO public.homepage_sections (section_key, section_name, title, subtitle, badge_text, is_visible, display_order) VALUES
('learning_paths', 'Learning Paths', 'Choose Your Learning Path', 'Whether you want to pass quickly or learn at your own pace, we have the perfect course for you', 'Find Your Perfect Fit', true, 1),
('whats_included', 'What''s Included', 'What''s Included With Every Course', 'Every booking comes packed with features to help you succeed', NULL, true, 2),
('featured_courses', 'Featured Courses', 'Courses Available Now', 'Real courses from verified instructors, ready to book today', 'Available Now', true, 3),
('everything_you_need', 'Everything You Need', 'Everything You Need to Learn to Drive', 'Access all the tools and resources for your driving journey', NULL, true, 4),
('testimonials', 'Testimonials', 'Why Learners Love Us', 'Join thousands of successful drivers who started their journey with us', NULL, true, 5),
('video_story', 'Video Story', 'Hear From Our Learners', 'Watch real stories from learners who passed with Every Driver', NULL, true, 6),
('stats', 'Stats Bar', 'From Nervous to Road Ready', NULL, NULL, true, 7),
('faqs', 'FAQs', 'Got Questions? We''ve Got Answers', NULL, NULL, true, 8),
('news', 'DVSA News', 'DVSA News & Updates', 'Stay up to date with the latest from the Driver and Vehicle Standards Agency', NULL, true, 9),
('cta', 'Call to Action', 'Ready to Start Your Driving Journey?', 'Join thousands of successful learners. Find your perfect course today.', NULL, true, 10);