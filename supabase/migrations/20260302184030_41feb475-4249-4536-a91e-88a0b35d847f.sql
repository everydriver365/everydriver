CREATE TABLE public.lesson_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_history_id UUID REFERENCES public.lesson_history(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;

-- Pupils can read and update their own feedback
CREATE POLICY "Pupils can view own feedback" ON public.lesson_feedback FOR SELECT USING (true);
CREATE POLICY "Pupils can update own feedback" ON public.lesson_feedback FOR UPDATE USING (pupil_id = pupil_id);
CREATE POLICY "Instructors can insert feedback requests" ON public.lesson_feedback FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_feedback;