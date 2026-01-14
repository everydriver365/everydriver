
-- Create site_settings table for global site configuration
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text NOT NULL DEFAULT 'text',
  label text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, label, description, display_order) VALUES
('site_title', 'EveryDriver | Find Driving Instructors & Courses Near You', 'text', 'Site Title', 'The main title shown in browser tabs (max 60 characters)', 1),
('meta_description', 'Find local driving instructors and book intensive, semi-intensive or weekly driving courses. Professional lessons with flexible payment options.', 'textarea', 'Meta Description', 'Description shown in search results (max 160 characters)', 2),
('og_title', 'EveryDriver - Learn to Drive with Confidence', 'text', 'Social Share Title', 'Title shown when sharing on social media', 3),
('og_description', 'Book driving lessons with trusted local instructors. Intensive courses, flexible payments, and free re-test guarantee.', 'textarea', 'Social Share Description', 'Description shown when sharing on social media', 4),
('og_image_url', '', 'image', 'Social Share Image', 'Image shown when sharing on social media (1200x630 recommended)', 5),
('twitter_handle', '', 'text', 'Twitter Handle', 'Your Twitter/X username (without @)', 6),
('google_analytics_id', '', 'text', 'Google Analytics ID', 'Your GA4 measurement ID (e.g., G-XXXXXXXXXX)', 7),
('contact_email', 'hello@everydriver.co.uk', 'email', 'Contact Email', 'Main contact email address', 8),
('contact_phone', '0800 123 4567', 'tel', 'Contact Phone', 'Main contact phone number', 9),
('footer_copyright', 'EveryDriver', 'text', 'Footer Copyright Name', 'Company name shown in footer copyright', 10);
