CREATE POLICY "Instructors insert their own phone numbers"
ON public.instructor_phone_numbers FOR INSERT
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete their own phone numbers"
ON public.instructor_phone_numbers FOR DELETE
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));