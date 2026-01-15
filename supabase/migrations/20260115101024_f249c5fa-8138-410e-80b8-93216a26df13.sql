-- Add last_external_sync tracking column to instructor_calendar_tokens
ALTER TABLE public.instructor_calendar_tokens 
ADD COLUMN IF NOT EXISTS last_external_sync TIMESTAMP WITH TIME ZONE;

-- Add index for efficient lookup of external calendar events
CREATE INDEX IF NOT EXISTS idx_instructor_calendar_events_lookup 
ON public.instructor_calendar_events(instructor_id, start_time, is_busy);

-- Add comment for documentation
COMMENT ON COLUMN public.instructor_calendar_tokens.last_external_sync IS 'Timestamp of the last time external Google Calendar events were synced to this platform';