-- Create instructor portal homepage content table
CREATE TABLE public.instructor_homepage_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Hero section
  hero_image_url TEXT,
  
  -- Motivational card
  motivation_title TEXT NOT NULL DEFAULT 'ON YOUR MARKS...',
  motivation_subtitle TEXT NOT NULL DEFAULT 'Every lesson is a step towards success.',
  show_progress_indicator BOOLEAN DEFAULT true,
  progress_label TEXT DEFAULT 'LESSONS',
  
  -- Quick action tiles (stored as JSONB for flexibility)
  quick_actions JSONB DEFAULT '[
    {"id": "schedule", "title": "View Schedule", "icon": "Calendar", "route": "/instructor/schedule", "display_order": 1},
    {"id": "pupils", "title": "My Pupils", "icon": "Users", "route": "/instructor/pupils", "display_order": 2},
    {"id": "jobs", "title": "Job Offers", "icon": "Briefcase", "route": "/instructor/jobs", "display_order": 3},
    {"id": "payments", "title": "Payments", "icon": "CreditCard", "route": "/instructor/pay", "display_order": 4}
  ]'::jsonb,
  
  -- Promotional banners (JSONB array)
  promo_banners JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.instructor_homepage_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth required for now)
CREATE POLICY "Allow public read access to instructor homepage content"
ON public.instructor_homepage_content
FOR SELECT
USING (true);

-- Allow public update for admin purposes (in production, restrict to admin role)
CREATE POLICY "Allow public update to instructor homepage content"
ON public.instructor_homepage_content
FOR UPDATE
USING (true);

CREATE POLICY "Allow public insert to instructor homepage content"
ON public.instructor_homepage_content
FOR INSERT
WITH CHECK (true);

-- Insert default content
INSERT INTO public.instructor_homepage_content (
  motivation_title,
  motivation_subtitle,
  progress_label,
  quick_actions,
  promo_banners
) VALUES (
  'READY TO DRIVE?',
  'Every lesson brings your pupils closer to success.',
  'TODAY',
  '[
    {"id": "schedule", "title": "View Schedule", "icon": "Calendar", "route": "/instructor/schedule", "display_order": 1},
    {"id": "pupils", "title": "My Pupils", "icon": "Users", "route": "/instructor/pupils", "display_order": 2},
    {"id": "jobs", "title": "Job Offers", "icon": "Briefcase", "route": "/instructor/jobs", "display_order": 3},
    {"id": "payments", "title": "Payments", "icon": "CreditCard", "route": "/instructor/pay", "display_order": 4},
    {"id": "gaps", "title": "Fill Gaps", "icon": "Clock", "route": "/instructor/portal", "display_order": 5},
    {"id": "settings", "title": "Settings", "icon": "Settings", "route": "/instructor/settings", "display_order": 6}
  ]'::jsonb,
  '[
    {"id": "referral", "title": "Refer a Friend", "subtitle": "Earn £50 for each instructor you refer", "image_url": null, "link": "/instructor/settings"}
  ]'::jsonb
);

-- Create update trigger for timestamps
CREATE TRIGGER update_instructor_homepage_content_updated_at
BEFORE UPDATE ON public.instructor_homepage_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();