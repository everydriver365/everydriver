
-- Create feature_plan_assignments table
CREATE TABLE public.feature_plan_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL REFERENCES public.feature_showcase_items(id) ON DELETE CASCADE,
  plan_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feature_id, plan_slug)
);

-- Enable RLS
ALTER TABLE public.feature_plan_assignments ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read feature plan assignments"
ON public.feature_plan_assignments FOR SELECT
USING (true);

-- Admin write
CREATE POLICY "Admins can insert feature plan assignments"
ON public.feature_plan_assignments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feature plan assignments"
ON public.feature_plan_assignments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed from existing plan_tier data
-- Tier order: free < pro < max < multi < enterprise
INSERT INTO public.feature_plan_assignments (feature_id, plan_slug)
SELECT id, unnest(
  CASE plan_tier
    WHEN 'free' THEN ARRAY['free','pro','max','multi','enterprise']
    WHEN 'pro' THEN ARRAY['pro','max','multi','enterprise']
    WHEN 'max' THEN ARRAY['max','multi','enterprise']
    WHEN 'multi' THEN ARRAY['multi','enterprise']
    WHEN 'enterprise' THEN ARRAY['enterprise']
    ELSE ARRAY['free','pro','max','multi','enterprise']
  END
) AS plan_slug
FROM public.feature_showcase_items
ON CONFLICT DO NOTHING;

-- Add show_contact_us to subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN show_contact_us boolean NOT NULL DEFAULT false;
