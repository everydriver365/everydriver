-- Add provider and email columns to instructor_calendar_tokens
ALTER TABLE public.instructor_calendar_tokens
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google',
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add google_event_id to scheduled_lessons to track synced events
ALTER TABLE public.scheduled_lessons
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create unique constraint for instructor + provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'instructor_calendar_tokens_instructor_provider_key'
  ) THEN
    ALTER TABLE public.instructor_calendar_tokens
    ADD CONSTRAINT instructor_calendar_tokens_instructor_provider_key 
    UNIQUE (instructor_id, provider);
  END IF;
END $$;