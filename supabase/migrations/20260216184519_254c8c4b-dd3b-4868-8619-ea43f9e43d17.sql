CREATE TABLE public.test_slot_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id),
  centre TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_slot_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can insert own reservations"
  ON public.test_slot_reservations FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can read own reservations"
  ON public.test_slot_reservations FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins can manage all reservations"
  ON public.test_slot_reservations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));