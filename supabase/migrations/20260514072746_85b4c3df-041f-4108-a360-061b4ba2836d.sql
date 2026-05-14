CREATE POLICY "Availability windows publicly viewable for booking"
  ON public.availability_windows
  FOR SELECT
  USING (true);