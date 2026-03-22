
CREATE TABLE public.test_slot_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL,
  test_centre text NOT NULL,
  preferred_dates jsonb DEFAULT '[]'::jsonb,
  current_test_date date,
  status text NOT NULL DEFAULT 'active',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_slot_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own test slot watches"
  ON public.test_slot_watches
  FOR ALL
  TO authenticated
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));
