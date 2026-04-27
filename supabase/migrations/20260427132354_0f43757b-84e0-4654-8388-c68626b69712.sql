ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_history_lesson
  ON public.payment_history(lesson_id)
  WHERE lesson_id IS NOT NULL;