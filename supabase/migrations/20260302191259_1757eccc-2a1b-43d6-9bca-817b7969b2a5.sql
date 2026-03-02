
-- Changelog for What's New modal
CREATE TABLE IF NOT EXISTS public.changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  portal_types TEXT[] NOT NULL DEFAULT '{instructor,pupil,parent,admin}',
  version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published changelog"
  ON public.changelog FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admin can manage changelog"
  ON public.changelog FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
