CREATE POLICY "Instructors can insert own courses" ON public.instructor_courses
FOR INSERT TO authenticated
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own courses" ON public.instructor_courses
FOR UPDATE TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can delete own courses" ON public.instructor_courses
FOR DELETE TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));