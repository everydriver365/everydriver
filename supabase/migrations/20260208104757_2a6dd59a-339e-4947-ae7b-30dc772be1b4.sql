
-- Add next_lesson_plan column to lesson_history
ALTER TABLE public.lesson_history ADD COLUMN next_lesson_plan TEXT;

-- Create lesson_syllabus_updates table
CREATE TABLE public.lesson_syllabus_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_history_id UUID NOT NULL REFERENCES public.lesson_history(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  competency_id TEXT NOT NULL,
  previous_level INTEGER NOT NULL DEFAULT 0,
  new_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quick queries
CREATE INDEX idx_lesson_syllabus_updates_lesson ON public.lesson_syllabus_updates(lesson_history_id);
CREATE INDEX idx_lesson_syllabus_updates_pupil ON public.lesson_syllabus_updates(pupil_id);

-- Enable RLS
ALTER TABLE public.lesson_syllabus_updates ENABLE ROW LEVEL SECURITY;

-- Instructor can insert/read updates for their own pupils
CREATE POLICY "Instructors can insert syllabus updates for their pupils"
ON public.lesson_syllabus_updates
FOR INSERT
TO authenticated
WITH CHECK (
  pupil_id IN (
    SELECT p.id FROM public.pupils p
    WHERE p.instructor_id = public.get_instructor_id_for_user(auth.uid())
  )
);

CREATE POLICY "Instructors can read syllabus updates for their pupils"
ON public.lesson_syllabus_updates
FOR SELECT
TO authenticated
USING (
  pupil_id IN (
    SELECT p.id FROM public.pupils p
    WHERE p.instructor_id = public.get_instructor_id_for_user(auth.uid())
  )
);

-- Pupils can read their own updates (via pupil portal OTP auth - using anon)
CREATE POLICY "Anyone can read syllabus updates by pupil_id"
ON public.lesson_syllabus_updates
FOR SELECT
TO anon
USING (true);
