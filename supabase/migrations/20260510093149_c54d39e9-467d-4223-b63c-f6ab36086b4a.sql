-- Allow admins to view and replay notification outbox rows
CREATE POLICY "Admins can view notification outbox"
  ON public.notification_outbox FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can replay notification outbox"
  ON public.notification_outbox FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));