ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS allowed_lesson_lengths integer[] DEFAULT ARRAY[60, 120]::integer[];

COMMENT ON COLUMN public.instructors.allowed_lesson_lengths IS 'Array of allowed lesson durations in minutes (e.g., 60=1hr, 120=2hr)';