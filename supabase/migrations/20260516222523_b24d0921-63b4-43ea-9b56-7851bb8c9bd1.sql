-- Add pickup/dropoff coordinates to scheduled_lessons so travel time between
-- consecutive bookings can be computed without re-geocoding postcodes.
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS pickup_lat   numeric(9,6),
  ADD COLUMN IF NOT EXISTS pickup_lng   numeric(9,6),
  ADD COLUMN IF NOT EXISTS dropoff_lat  numeric(9,6),
  ADD COLUMN IF NOT EXISTS dropoff_lng  numeric(9,6);

COMMENT ON COLUMN public.scheduled_lessons.pickup_lat  IS 'Latitude of pickup location, resolved from pickup_postcode at booking time.';
COMMENT ON COLUMN public.scheduled_lessons.pickup_lng  IS 'Longitude of pickup location, resolved from pickup_postcode at booking time.';
COMMENT ON COLUMN public.scheduled_lessons.dropoff_lat IS 'Latitude of dropoff location, resolved from dropoff_postcode at booking time.';
COMMENT ON COLUMN public.scheduled_lessons.dropoff_lng IS 'Longitude of dropoff location, resolved from dropoff_postcode at booking time.';

-- Composite index to support fast lookup of "previous lesson end coords" when
-- computing inter-lesson travel time for a candidate slot.
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_instructor_date_geo
  ON public.scheduled_lessons (instructor_id, lesson_date, start_time)
  WHERE deleted_at IS NULL;