-- Create table for PWA app configurations
CREATE TABLE public.pwa_app_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_type TEXT NOT NULL UNIQUE CHECK (app_type IN ('instructor', 'pupil', 'parent')),
  app_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  theme_color TEXT NOT NULL DEFAULT '#1e3a5f',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  icon_192_url TEXT,
  icon_512_url TEXT,
  start_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pwa_app_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for manifest generation)
CREATE POLICY "PWA configs are publicly readable" 
ON public.pwa_app_configs 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pwa_app_configs_updated_at
BEFORE UPDATE ON public.pwa_app_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.pwa_app_configs (app_type, app_name, short_name, description, theme_color, background_color, start_url) VALUES
('instructor', 'DL Instructor', 'DL Instructor', 'Manage your driving lessons, pupils, and schedule', '#1e3a5f', '#ffffff', '/instructor'),
('pupil', 'DL Learner', 'DL Learner', 'Track your driving lessons and progress', '#1e3a5f', '#ffffff', '/pupil'),
('parent', 'DL Parent', 'DL Parent', 'Monitor your child''s driving lesson progress', '#1e3a5f', '#ffffff', '/parent');