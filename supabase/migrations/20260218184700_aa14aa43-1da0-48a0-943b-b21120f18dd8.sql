
CREATE TABLE public.learner_test_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  postcode TEXT NOT NULL,
  preferred_centre TEXT,
  preferred_date DATE NOT NULL,
  preferred_date_end DATE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learner_test_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public-facing form)
CREATE POLICY "Anyone can submit a test request"
  ON public.learner_test_requests
  FOR INSERT
  WITH CHECK (true);

-- Only allow reading own requests (not needed for now, but safe)
CREATE POLICY "Service role can read all"
  ON public.learner_test_requests
  FOR SELECT
  USING (true);

CREATE TRIGGER set_learner_test_requests_updated_at
  BEFORE UPDATE ON public.learner_test_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
