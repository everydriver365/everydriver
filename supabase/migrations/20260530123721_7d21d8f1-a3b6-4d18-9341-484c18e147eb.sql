
CREATE TABLE public.course_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  actor_user_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_activity_log_pupil ON public.course_activity_log(pupil_id, created_at DESC);
CREATE INDEX idx_course_activity_log_instructor ON public.course_activity_log(instructor_id, created_at DESC);

GRANT SELECT, INSERT ON public.course_activity_log TO authenticated;
GRANT ALL ON public.course_activity_log TO service_role;

ALTER TABLE public.course_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor can view own course activity"
  ON public.course_activity_log
  FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructor can insert own course activity"
  ON public.course_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));
