CREATE TABLE public.reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid NOT NULL,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  requested_date date NOT NULL,
  requested_time time,
  original_date date,
  original_time time,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pupils can insert own reschedule requests"
  ON public.reschedule_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Pupils can view own reschedule requests"
  ON public.reschedule_requests FOR SELECT
  USING (true);

CREATE POLICY "Instructors can update own reschedule requests"
  ON public.reschedule_requests FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));