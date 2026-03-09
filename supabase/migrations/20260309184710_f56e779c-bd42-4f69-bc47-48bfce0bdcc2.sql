CREATE POLICY "Anon can select pupil by id"
ON public.pupils
FOR SELECT
TO anon
USING (true);