-- Create table for homepage features section
CREATE TABLE public.homepage_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Calendar',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_features ENABLE ROW LEVEL SECURITY;

-- RLS policies - public read, admin write
CREATE POLICY "Homepage features are publicly viewable" 
ON public.homepage_features FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can manage homepage features" 
ON public.homepage_features FOR ALL 
USING (true);

-- Insert default features
INSERT INTO public.homepage_features (title, description, icon_name, display_order) VALUES
('Live Availability', 'See real-time availability synced with Google Calendar. Book lessons that fit your schedule.', 'Calendar', 1),
('Local Instructors', 'Find certified instructors near you. Search by postcode and set your preferred radius.', 'MapPin', 2),
('Track Progress', 'Monitor your learning journey with detailed progress reports and skill assessments.', 'Award', 3),
('Parent Visibility', 'Parents can track lessons, progress, and payments through a dedicated portal.', 'Users', 4);

-- Add trigger for updated_at
CREATE TRIGGER update_homepage_features_updated_at
BEFORE UPDATE ON public.homepage_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();