
CREATE TABLE public.instructor_postcode_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  outward_code TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, outward_code)
);

CREATE INDEX idx_instructor_postcode_rates_lookup
  ON public.instructor_postcode_rates (instructor_id, outward_code);

ALTER TABLE public.instructor_postcode_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own postcode rates"
  ON public.instructor_postcode_rates FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own postcode rates"
  ON public.instructor_postcode_rates FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own postcode rates"
  ON public.instructor_postcode_rates FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete own postcode rates"
  ON public.instructor_postcode_rates FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER update_instructor_postcode_rates_updated_at
  BEFORE UPDATE ON public.instructor_postcode_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
