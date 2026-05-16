-- Public-safe RPC: returns coords-only view of booked lessons so the
-- availability engine can pad candidate slots with realistic travel time
-- between consecutive bookings. No PII leaves the database.
CREATE OR REPLACE FUNCTION public.get_public_instructor_lesson_geo(
  p_instructor_ids uuid[],
  p_from_date date,
  p_to_date   date
)
RETURNS TABLE (
  instructor_id    uuid,
  lesson_date      date,
  start_time       time without time zone,
  duration_minutes integer,
  pickup_lat       numeric,
  pickup_lng       numeric,
  dropoff_lat      numeric,
  dropoff_lng      numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    sl.instructor_id,
    sl.lesson_date,
    sl.start_time,
    sl.duration_minutes,
    sl.pickup_lat,
    sl.pickup_lng,
    sl.dropoff_lat,
    sl.dropoff_lng
  FROM public.scheduled_lessons sl
  WHERE sl.instructor_id = ANY (p_instructor_ids)
    AND sl.lesson_date BETWEEN p_from_date AND p_to_date
    AND sl.deleted_at IS NULL
    AND sl.status <> 'cancelled'
    AND (sl.pickup_lat IS NOT NULL OR sl.dropoff_lat IS NOT NULL);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_instructor_lesson_geo(uuid[], date, date) TO anon, authenticated;