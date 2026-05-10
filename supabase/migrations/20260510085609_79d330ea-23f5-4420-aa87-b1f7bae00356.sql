
-- 1. Extend instructor_notification_settings
ALTER TABLE public.instructor_notification_settings
  ADD COLUMN IF NOT EXISTS end_of_lesson_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_of_lesson_lead_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_summary_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_summary_time time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS daily_summary_include jsonb NOT NULL DEFAULT
    '{"tomorrow_lessons":true,"payments_due":true,"pupil_messages":true,"job_offers":true,"test_swaps":true}'::jsonb;

-- 2. Notification outbox for deferred sends
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  category text NOT NULL,
  importance text NOT NULL DEFAULT 'normal',
  title text,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deliver_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
  ON public.notification_outbox (deliver_at)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_outbox_instructor
  ON public.notification_outbox (instructor_id, created_at DESC);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view their own outbox"
  ON public.notification_outbox FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
