-- Create a table for site-wide dynamic images
CREATE TABLE public.site_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_key TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Site images are publicly viewable"
ON public.site_images
FOR SELECT
USING (true);

-- Admin management access (for now, allow all - will restrict with auth later)
CREATE POLICY "Anyone can manage site images"
ON public.site_images
FOR ALL
USING (true);

-- Add timestamp trigger
CREATE TRIGGER update_site_images_updated_at
BEFORE UPDATE ON public.site_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default image entries for the homepage
INSERT INTO public.site_images (image_key, image_url, alt_text, description, category, display_order) VALUES
  ('hero_background', '', 'Hero background', 'Main hero section background image', 'hero', 1),
  ('testimonial_sarah', '', 'Sarah testimonial', 'Sarah testimonial photo', 'testimonials', 1),
  ('testimonial_james', '', 'James testimonial', 'James testimonial photo', 'testimonials', 2),
  ('testimonial_emma', '', 'Emma testimonial', 'Emma testimonial photo', 'testimonials', 3),
  ('testimonial_priya', '', 'Priya testimonial', 'Priya testimonial photo', 'testimonials', 4),
  ('testimonial_emily', '', 'Emily testimonial', 'Emily testimonial photo', 'testimonials', 5),
  ('feature_theory', '', 'Theory test prep', 'Theory test preparation feature image', 'features', 1),
  ('feature_payments', '', 'Flexible payments', 'Flexible payment options feature image', 'features', 2),
  ('feature_cancellation', '', 'Free cancellation', 'Free cancellation feature image', 'features', 3);