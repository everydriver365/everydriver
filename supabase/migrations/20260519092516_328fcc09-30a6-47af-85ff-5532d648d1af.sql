CREATE TABLE IF NOT EXISTS public.test_reminders_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN ('theory','driving')),
  test_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  sent_via TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pupil_id, test_type, test_date, days_before, sent_via)
);

CREATE INDEX IF NOT EXISTS idx_test_reminders_log_instructor ON public.test_reminders_log(instructor_id);
CREATE INDEX IF NOT EXISTS idx_test_reminders_log_pupil ON public.test_reminders_log(pupil_id);

ALTER TABLE public.test_reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own test reminders log"
ON public.test_reminders_log
FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));