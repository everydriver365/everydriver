
CREATE TABLE public.comparison_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price text NOT NULL,
  period text DEFAULT '/mo',
  cta_text text NOT NULL,
  icon_name text,
  is_popular boolean DEFAULT false,
  description text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.comparison_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  feature_name text NOT NULL,
  plan_values jsonb NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.comparison_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comparison plans" ON public.comparison_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can read comparison features" ON public.comparison_features FOR SELECT USING (true);

CREATE POLICY "Admins can manage comparison plans" ON public.comparison_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage comparison features" ON public.comparison_features FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
