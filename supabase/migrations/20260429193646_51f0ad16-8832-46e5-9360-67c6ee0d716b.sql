CREATE POLICY "Admins can view all audit logs"
  ON public.data_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));