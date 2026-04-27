-- Phase 1.4: Payment disputes / queries flagged by pupils
CREATE TYPE public.payment_dispute_status AS ENUM ('open', 'resolved', 'dismissed');

CREATE TABLE public.payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payment_history(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.payment_dispute_status NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_disputes_instructor ON public.payment_disputes(instructor_id, status);
CREATE INDEX idx_payment_disputes_pupil ON public.payment_disputes(pupil_id);
CREATE INDEX idx_payment_disputes_payment ON public.payment_disputes(payment_id);

ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

-- Instructors can view & manage disputes against their own pupils
CREATE POLICY "Instructors view their disputes"
  ON public.payment_disputes FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update their disputes"
  ON public.payment_disputes FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Pupil dispute creation will go via an edge function with service role
-- (pupils use OTP sessions, not authenticated user accounts)

CREATE TRIGGER trg_payment_disputes_updated_at
  BEFORE UPDATE ON public.payment_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 4.3: Pupil weekly streak view (read-only, computed from scheduled_lessons)
CREATE OR REPLACE VIEW public.pupil_weekly_streaks AS
WITH weeks AS (
  SELECT
    pupil_id,
    date_trunc('week', lesson_date)::date AS week_start,
    COUNT(*) AS lesson_count
  FROM public.scheduled_lessons
  WHERE lesson_date IS NOT NULL
  GROUP BY pupil_id, date_trunc('week', lesson_date)
)
SELECT
  pupil_id,
  COUNT(*) AS total_active_weeks,
  MAX(week_start) AS last_active_week,
  SUM(lesson_count)::int AS total_lessons
FROM weeks
GROUP BY pupil_id;

GRANT SELECT ON public.pupil_weekly_streaks TO authenticated;