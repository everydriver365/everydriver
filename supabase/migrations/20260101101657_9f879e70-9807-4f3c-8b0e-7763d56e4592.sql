ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS available_from date;

COMMENT ON COLUMN public.instructors.available_from IS 'Earliest date the instructor accepts new bookings (inclusive). Null means available immediately.';