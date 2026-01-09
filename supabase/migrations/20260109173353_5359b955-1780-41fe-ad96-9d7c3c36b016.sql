-- Create table for homepage statistics
CREATE TABLE public.homepage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Award',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Homepage stats are publicly viewable" 
ON public.homepage_stats 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can manage homepage stats" 
ON public.homepage_stats 
FOR ALL 
USING (true);

-- Insert default stats
INSERT INTO public.homepage_stats (stat_value, stat_label, icon_name, display_order) VALUES 
('15,000+', 'Students Passed', 'GraduationCap', 1),
('98%', 'Pass Rate', 'Award', 2),
('500+', 'Instructors', 'Users', 3),
('24/7', 'Online Booking', 'Clock', 4);

-- Create table for homepage testimonials
CREATE TABLE public.homepage_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar_initials TEXT,
  image_key TEXT,
  course_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Homepage testimonials are publicly viewable" 
ON public.homepage_testimonials 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can manage homepage testimonials" 
ON public.homepage_testimonials 
FOR ALL 
USING (true);

-- Insert default testimonials
INSERT INTO public.homepage_testimonials (name, role, content, avatar_initials, image_key, course_type, is_featured, display_order) VALUES 
('Sarah', 'Passed First Time', 'Passed 1st time! ✨', 'S', 'testimonial_sarah', 'Intensive', true, 1),
('James', 'Intensive Course', 'Intensive Course 🚗', 'J', 'testimonial_james', 'Intensive', true, 2),
('Emma', 'Weekly Lessons', 'Weekly Lessons 💪', 'E', 'testimonial_emma', 'Weekly', true, 3),
('Priya', 'Semi-Intensive', 'Semi-Intensive 🎉', 'P', 'testimonial_priya', 'Semi-Intensive', true, 4),
('Emma Thompson', 'Passed First Time', 'The booking system made finding a local instructor so easy. Passed my test in just 8 weeks!', 'ET', NULL, NULL, false, 5),
('James Wilson', 'Parent', 'Being able to track my daughter''s progress and manage payments in one place is brilliant.', 'JW', NULL, NULL, false, 6),
('Sarah Mitchell', 'Driving Instructor', 'The calendar integration saves me hours every week. My students love the easy booking.', 'SM', NULL, NULL, false, 7);

-- Create table for hero content
CREATE TABLE public.homepage_hero (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_text TEXT NOT NULL DEFAULT 'Free Re-test',
  headline_line1 TEXT NOT NULL DEFAULT 'Your Driving',
  headline_line2 TEXT NOT NULL DEFAULT 'Success',
  headline_highlight TEXT NOT NULL DEFAULT 'Story',
  headline_line3 TEXT NOT NULL DEFAULT 'Starts Here',
  subtext TEXT NOT NULL DEFAULT 'Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster.',
  search_placeholder TEXT NOT NULL DEFAULT 'Enter your postcode...',
  search_button_text TEXT NOT NULL DEFAULT 'Find Courses',
  rating_value TEXT NOT NULL DEFAULT '4.9',
  learners_count TEXT NOT NULL DEFAULT '10k+',
  learners_label TEXT NOT NULL DEFAULT 'Learners',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_hero ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Homepage hero is publicly viewable" 
ON public.homepage_hero 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can manage homepage hero" 
ON public.homepage_hero 
FOR ALL 
USING (true);

-- Insert default hero content
INSERT INTO public.homepage_hero (badge_text, headline_line1, headline_line2, headline_highlight, headline_line3, subtext) VALUES 
('Free Re-test', 'Your Driving', 'Success', 'Story', 'Starts Here', 'Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster.');

-- Create triggers for updated_at
CREATE TRIGGER update_homepage_stats_updated_at
  BEFORE UPDATE ON public.homepage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_testimonials_updated_at
  BEFORE UPDATE ON public.homepage_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_hero_updated_at
  BEFORE UPDATE ON public.homepage_hero
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();