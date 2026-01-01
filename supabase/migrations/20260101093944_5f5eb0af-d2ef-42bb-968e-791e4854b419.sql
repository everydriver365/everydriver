-- Add end date column for date range overrides (null = forever)
ALTER TABLE public.instructor_date_overrides
ADD COLUMN IF NOT EXISTS override_end_date date;

-- Add comment explaining the null behavior
COMMENT ON COLUMN public.instructor_date_overrides.override_end_date IS 'End date for the override range. NULL means the override applies indefinitely from the start date.';