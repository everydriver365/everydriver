ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS share_lesson_notes_with_pupil boolean NOT NULL DEFAULT false;