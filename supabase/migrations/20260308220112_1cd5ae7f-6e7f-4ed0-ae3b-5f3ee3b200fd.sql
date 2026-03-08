CREATE POLICY "Active instructors publicly viewable"
ON public.instructors FOR SELECT TO anon
USING (is_active = true);