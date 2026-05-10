
-- Allow instructors to manage their own test centre selections.
-- Same pattern that fixed instructor_courses last week.

CREATE POLICY "Instructors can insert own test centres"
  ON public.instructor_test_centres
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own test centres"
  ON public.instructor_test_centres
  FOR UPDATE
  TO authenticated
  USING       (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK  (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can delete own test centres"
  ON public.instructor_test_centres
  FOR DELETE
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
