-- Phase 1: Database Changes for Nylas Migration

-- 1.1 Create new table for Nylas grants (replaces instructor_calendar_tokens)
CREATE TABLE public.instructor_nylas_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  grant_id TEXT NOT NULL,
  email TEXT,
  provider TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_nylas_grants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Nylas grants
CREATE POLICY "Service role can manage all grants"
ON public.instructor_nylas_grants
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Instructors can view their own grants"
ON public.instructor_nylas_grants
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM instructors WHERE auth_user_id = auth.uid()
));

-- 1.2 Rename google_event_id to external_event_id in instructor_calendar_events
ALTER TABLE public.instructor_calendar_events 
  RENAME COLUMN google_event_id TO external_event_id;

-- 1.3 Drop the webhook channels table (Nylas manages webhooks internally)
DROP TABLE IF EXISTS public.calendar_webhook_channels;

-- Add trigger for updated_at on nylas grants
CREATE TRIGGER update_instructor_nylas_grants_updated_at
  BEFORE UPDATE ON public.instructor_nylas_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();