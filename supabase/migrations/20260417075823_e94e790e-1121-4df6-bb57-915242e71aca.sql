ALTER TABLE public.instructor_calendar_events
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS meeting_provider text,
  ADD COLUMN IF NOT EXISTS html_link text;