-- Admin access to Google Calendar service connection rows
CREATE POLICY "Admins view google service calendar"
ON public.instructor_google_service_calendar
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin insert into calendar_sync_queue (for force re-sync from admin dashboard)
CREATE POLICY "Admins insert calendar_sync_queue"
ON public.calendar_sync_queue
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));