
-- Add columns to scheduled_lessons for auto-linking Geotab trips
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS geotab_trip_id text,
  ADD COLUMN IF NOT EXISTS trip_auto_linked_at timestamptz;

-- Index for fast lookup during trip matching
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_geotab_trip
  ON public.scheduled_lessons (geotab_trip_id)
  WHERE geotab_trip_id IS NOT NULL;

-- Index for efficient date+instructor lookup during trip matching
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_date_instructor
  ON public.scheduled_lessons (lesson_date, instructor_id, start_time);
