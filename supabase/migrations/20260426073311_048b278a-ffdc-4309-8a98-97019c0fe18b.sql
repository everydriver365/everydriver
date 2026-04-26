ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS test_centre_id uuid REFERENCES public.test_centres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS examiner_id uuid REFERENCES public.examiners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_test_centre_id ON public.scheduled_lessons(test_centre_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_examiner_id ON public.scheduled_lessons(examiner_id);