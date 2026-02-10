
-- Fix overly permissive service role policy - restrict to service_role only
DROP POLICY "Service role can manage timesheets" ON public.driver_timesheets;
