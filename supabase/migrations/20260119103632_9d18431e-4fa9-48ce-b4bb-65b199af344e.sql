-- Add UPDATE policy for pwa_app_configs to allow admins to update
CREATE POLICY "Admins can update PWA configs"
ON public.pwa_app_configs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also add INSERT policy in case new configs need to be created
CREATE POLICY "Admins can insert PWA configs"
ON public.pwa_app_configs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for completeness
CREATE POLICY "Admins can delete PWA configs"
ON public.pwa_app_configs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));