-- Create instructor_notifications table for in-app alerts
CREATE TABLE public.instructor_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_instructor_notifications_instructor ON public.instructor_notifications(instructor_id);
CREATE INDEX idx_instructor_notifications_unread ON public.instructor_notifications(instructor_id, is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.instructor_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies - instructors can only see their own notifications
CREATE POLICY "Instructors can view their own notifications"
ON public.instructor_notifications
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update their own notifications"
ON public.instructor_notifications
FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert notifications"
ON public.instructor_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_notifications;