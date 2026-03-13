
-- Add reminder_preferences to pupils table
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS reminder_preferences jsonb DEFAULT '{"24h": true, "1h": true}'::jsonb;

-- Create lesson_ratings table
CREATE TABLE public.lesson_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, pupil_id)
);

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Pupils can insert their own ratings (anon for portal access)
CREATE POLICY "Pupils can insert own ratings" ON public.lesson_ratings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Pupils can read own ratings
CREATE POLICY "Pupils can read own ratings" ON public.lesson_ratings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Instructors can read ratings for their lessons
CREATE POLICY "Instructors can read their ratings" ON public.lesson_ratings
  FOR SELECT TO authenticated
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));
