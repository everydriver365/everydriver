CREATE POLICY "Active instructors viewable by authenticated"
ON public.instructors
FOR SELECT
TO authenticated
USING (is_active = true);