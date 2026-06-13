CREATE TABLE IF NOT EXISTS public.coverage_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  postcode text NOT NULL,
  postcode_area text,
  looking_for text,
  source text DEFAULT 'out_of_area_waitlist',
  source_page text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.coverage_waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coverage_waitlist TO authenticated;
GRANT ALL ON public.coverage_waitlist TO service_role;

ALTER TABLE public.coverage_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (the form is public, no auth required)
CREATE POLICY "Anyone can submit coverage waitlist"
  ON public.coverage_waitlist FOR INSERT
  WITH CHECK (true);

-- Admins can read/manage everything
CREATE POLICY "Admins can read coverage waitlist"
  ON public.coverage_waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update coverage waitlist"
  ON public.coverage_waitlist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete coverage waitlist"
  ON public.coverage_waitlist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_coverage_waitlist_area ON public.coverage_waitlist (postcode_area);
CREATE INDEX IF NOT EXISTS idx_coverage_waitlist_status ON public.coverage_waitlist (status, created_at DESC);

CREATE TRIGGER update_coverage_waitlist_updated_at
  BEFORE UPDATE ON public.coverage_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
