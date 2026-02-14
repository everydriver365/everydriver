
-- Create table for admin-managed feature showcase tiles
CREATE TABLE public.feature_showcase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'General',
  title TEXT NOT NULL,
  description TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  icon_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_showcase_items ENABLE ROW LEVEL SECURITY;

-- Public read access (marketing page)
CREATE POLICY "Anyone can view visible feature items"
ON public.feature_showcase_items
FOR SELECT
USING (is_visible = true);

-- Admin write access
CREATE POLICY "Admins can manage feature items"
ON public.feature_showcase_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_feature_showcase_items_updated_at
BEFORE UPDATE ON public.feature_showcase_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
