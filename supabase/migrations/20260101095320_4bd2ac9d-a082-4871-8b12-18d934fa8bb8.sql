-- Create course templates table for global course configuration
CREATE TABLE public.course_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_hours integer NOT NULL UNIQUE,
  course_name text NOT NULL,
  short_description text,
  full_description text,
  features text[] DEFAULT '{}',
  default_image_url text,
  is_intensive boolean DEFAULT false,
  is_popular boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Course templates are publicly viewable"
ON public.course_templates FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage course templates"
ON public.course_templates FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_course_templates_updated_at
BEFORE UPDATE ON public.course_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.course_templates (course_hours, course_name, short_description, features, is_intensive, is_popular, display_order) VALUES
(10, '10 Hour Course', 'Perfect for experienced drivers needing a refresher before their test.', ARRAY['Pick-up from home/work', 'Flexible scheduling', 'Theory support'], false, false, 1),
(20, '20 Hour Course', 'Ideal for drivers with some experience who need additional practice.', ARRAY['Pick-up from home/work', 'Flexible scheduling', 'Theory support', 'Mock test included'], false, false, 2),
(30, '30 Hour Course', 'Our most popular course for learners with basic driving knowledge.', ARRAY['Pick-up from home/work', 'Flexible scheduling', 'Theory support', 'Mock test included', 'Free re-test if needed'], false, true, 3),
(40, '40 Hour Course', 'Comprehensive course for complete beginners to become test-ready.', ARRAY['Pick-up from home/work', 'Flexible scheduling', 'Theory support', 'Multiple mock tests', 'Free re-test if needed', 'Highway driving included'], false, true, 4),
(28, 'Test in a Week', 'Intensive 7-day course to get you test-ready fast.', ARRAY['Daily 4-hour lessons', 'Fast-track to test', 'Theory support', 'Test booking assistance', 'Free re-test if needed'], true, false, 5);