ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS awaiting_initial_payment boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_awaiting_payment
  ON public.scheduled_lessons (awaiting_initial_payment)
  WHERE awaiting_initial_payment = true;

COMMENT ON COLUMN public.scheduled_lessons.awaiting_initial_payment IS
  'When true, the public booking flow created this lesson but payment has not yet completed. The calendar sync queue worker skips these so they are NOT pushed to Google Calendar until the flag is cleared by a successful payment.';