CREATE TABLE public.public_test_swap_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  current_centre_id uuid REFERENCES public.test_centres(id),
  current_centre_name text,
  current_test_date date,
  current_test_time time,
  has_test_booked boolean NOT NULL DEFAULT true,
  earliest_new_date date,
  latest_new_date date,
  alternate_centre_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  consent_given boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_test_swap_signups ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can insert a signup
CREATE POLICY "Anyone can submit a swap signup"
  ON public.public_test_swap_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (consent_given = true);

-- Only admins can read/update/delete
CREATE POLICY "Admins read swap signups"
  ON public.public_test_swap_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update swap signups"
  ON public.public_test_swap_signups
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete swap signups"
  ON public.public_test_swap_signups
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_public_test_swap_signups_centre ON public.public_test_swap_signups(current_centre_id);
CREATE INDEX idx_public_test_swap_signups_status ON public.public_test_swap_signups(status);
CREATE INDEX idx_public_test_swap_signups_created ON public.public_test_swap_signups(created_at DESC);

CREATE TRIGGER trg_public_test_swap_signups_updated_at
  BEFORE UPDATE ON public.public_test_swap_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();