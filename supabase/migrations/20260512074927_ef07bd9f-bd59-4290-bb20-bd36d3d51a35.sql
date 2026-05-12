CREATE POLICY "Instructors view own franchise fees"
ON public.school_franchise_fees
FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));