
CREATE TABLE public.pupil_test_readiness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  verdict TEXT NOT NULL CHECK (verdict IN ('not_ready','nearly_ready','ready')),
  summary TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pupil_test_readiness_pupil ON public.pupil_test_readiness(pupil_id, assessed_at DESC);
CREATE INDEX idx_pupil_test_readiness_instructor ON public.pupil_test_readiness(instructor_id, assessed_at DESC);

GRANT SELECT ON public.pupil_test_readiness TO authenticated;
GRANT ALL ON public.pupil_test_readiness TO service_role;

ALTER TABLE public.pupil_test_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own pupils readiness"
ON public.pupil_test_readiness FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service role manages readiness"
ON public.pupil_test_readiness FOR ALL
TO service_role
USING (true) WITH CHECK (true);
