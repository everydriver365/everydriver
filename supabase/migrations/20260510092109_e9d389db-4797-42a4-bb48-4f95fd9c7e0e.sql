ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS eol_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_eol_pending
  ON public.scheduled_lessons (instructor_id, lesson_date)
  WHERE eol_sent_at IS NULL AND deleted_at IS NULL;