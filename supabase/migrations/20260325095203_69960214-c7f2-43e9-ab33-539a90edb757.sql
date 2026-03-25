
-- Enable RLS on calendar_sync_queue if not already
ALTER TABLE public.calendar_sync_queue ENABLE ROW LEVEL SECURITY;

-- Admin can view all sync queue items
CREATE POLICY "Admins can select calendar_sync_queue"
ON public.calendar_sync_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update sync queue items (for retry)
CREATE POLICY "Admins can update calendar_sync_queue"
ON public.calendar_sync_queue
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
