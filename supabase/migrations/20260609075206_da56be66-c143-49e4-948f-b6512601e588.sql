CREATE TABLE public.deposit_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  reminder_type text NOT NULL,
  amount_owed numeric,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deposit_reminder_log_pupil_sent ON public.deposit_reminder_log (pupil_id, reminder_type, sent_at DESC);
GRANT SELECT ON public.deposit_reminder_log TO authenticated;
GRANT ALL ON public.deposit_reminder_log TO service_role;
ALTER TABLE public.deposit_reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors view own deposit reminder log"
  ON public.deposit_reminder_log FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
