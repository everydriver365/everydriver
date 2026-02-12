
-- Marketing Pages table
CREATE TABLE public.marketing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  page_title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Page Sections table
CREATE TABLE public.marketing_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.marketing_pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'content',
  title TEXT,
  subtitle TEXT,
  content JSONB DEFAULT '{}',
  image_url TEXT,
  video_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_page_sections ENABLE ROW LEVEL SECURITY;

-- Public read access (marketing pages are public-facing)
CREATE POLICY "Marketing pages are publicly readable"
ON public.marketing_pages FOR SELECT USING (true);

CREATE POLICY "Marketing sections are publicly readable"
ON public.marketing_page_sections FOR SELECT USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage marketing pages"
ON public.marketing_pages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage marketing sections"
ON public.marketing_page_sections FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_marketing_sections_page_id ON public.marketing_page_sections(page_id);
CREATE INDEX idx_marketing_sections_order ON public.marketing_page_sections(page_id, display_order);

-- Updated at triggers
CREATE TRIGGER update_marketing_pages_updated_at
BEFORE UPDATE ON public.marketing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_sections_updated_at
BEFORE UPDATE ON public.marketing_page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default pages
INSERT INTO public.marketing_pages (page_key, page_title, meta_title, meta_description) VALUES
  ('features', 'Features', 'Free Instructor Diary App | EveryDriver', 'The complete driving instructor platform. Free diary app with 50+ tools.'),
  ('telematics', 'Telematics', 'GPS Telematics for Driving Instructors | EveryDriver', 'Real-time speed monitoring, driver scoring, and trip replay for driving lessons.'),
  ('dashcam', 'Dashcam', 'AI Dashcam for Driving Instructors | EveryDriver', 'HD dashcam with AI incident detection and cloud storage for driving lessons.'),
  ('domains', 'Websites & Domains', 'Professional Website for Driving Instructors | EveryDriver', 'Get your own professional driving instructor website with custom domain.'),
  ('about', 'About', 'About EveryDriver', 'Learn about the team behind EveryDriver.'),
  ('pricing', 'Pricing', 'Pricing Plans | EveryDriver', 'Simple, transparent pricing for driving instructors.'),
  ('contact', 'Contact', 'Contact Us | EveryDriver', 'Get in touch with the EveryDriver team.');

-- Create storage bucket for marketing images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-images', 'marketing-images', true);

-- Storage policies for marketing images
CREATE POLICY "Marketing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-images');

CREATE POLICY "Admins can upload marketing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update marketing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete marketing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));
