-- Table to track Google Calendar webhook channels
CREATE TABLE public.calendar_webhook_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL UNIQUE,
  resource_id TEXT NOT NULL,
  expiration TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.calendar_webhook_channels ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role only" ON public.calendar_webhook_channels
  FOR ALL USING (false);

-- Index for finding expiring channels
CREATE INDEX idx_webhook_channels_expiration ON public.calendar_webhook_channels(expiration);