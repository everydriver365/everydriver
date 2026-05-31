-- Allow admins to view and manage all quotes
CREATE POLICY "Admins can manage all quotes"
  ON public.quotes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));