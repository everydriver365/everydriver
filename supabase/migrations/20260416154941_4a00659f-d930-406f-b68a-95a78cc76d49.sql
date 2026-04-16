ALTER TABLE public.instructor_calendar_events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.instructor_calendar_events ADD COLUMN IF NOT EXISTS description text;