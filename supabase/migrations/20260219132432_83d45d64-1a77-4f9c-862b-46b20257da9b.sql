-- Allow admins full access to gps_devices
CREATE POLICY "Admins can insert gps_devices"
ON public.gps_devices FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can select gps_devices"
ON public.gps_devices FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gps_devices"
ON public.gps_devices FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gps_devices"
ON public.gps_devices FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));