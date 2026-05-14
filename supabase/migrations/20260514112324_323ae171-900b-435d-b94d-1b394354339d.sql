-- Replace temporary public views with explicit safe RPC functions.
-- SECURITY DEFINER is intentional here because the underlying tables contain
-- private fields, but each function returns only non-personal scheduling fields.

DROP VIEW IF EXISTS public.public_scheduled_lesson_blocks;
DROP VIEW IF EXISTS public.public_instructor_manual_blocks;
DROP VIEW IF EXISTS public.public_instructor_booking_preferences;
DROP VIEW IF EXISTS public.public_instructor_presence;

CREATE OR REPLACE FUNCTION public.get_public_scheduled_lesson_blocks(
  p_instructor_ids uuid[],
  p_from_date date,
  p_to_date date
)
RETURNS TABLE (
  instructor_id uuid,
  lesson_date date,
  start_time time without time zone,
  duration_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.instructor_id, sl.lesson_date, sl.start_time, sl.duration_minutes
  FROM public.scheduled_lessons sl
  JOIN public.instructors i ON i.id = sl.instructor_id
  WHERE i.is_active = true
    AND sl.instructor_id = ANY(p_instructor_ids)
    AND sl.deleted_at IS NULL
    AND sl.status <> 'cancelled'
    AND sl.lesson_date >= p_from_date
    AND sl.lesson_date <= p_to_date;
$$;

CREATE OR REPLACE FUNCTION public.get_public_instructor_manual_blocks(
  p_instructor_ids uuid[],
  p_from_datetime timestamptz,
  p_to_datetime timestamptz
)
RETURNS TABLE (
  instructor_id uuid,
  start_datetime timestamptz,
  end_datetime timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mb.instructor_id, mb.start_datetime, mb.end_datetime
  FROM public.instructor_manual_blocks mb
  JOIN public.instructors i ON i.id = mb.instructor_id
  WHERE i.is_active = true
    AND mb.instructor_id = ANY(p_instructor_ids)
    AND mb.end_datetime >= p_from_datetime
    AND mb.start_datetime <= p_to_datetime;
$$;

CREATE OR REPLACE FUNCTION public.get_public_instructor_booking_preferences(
  p_instructor_id uuid
)
RETURNS TABLE (
  id uuid,
  prefer_earliest_slot boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, COALESCE(i.prefer_earliest_slot, false) AS prefer_earliest_slot
  FROM public.instructors i
  WHERE i.id = p_instructor_id
    AND i.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_instructor_presence(
  p_instructor_id uuid
)
RETURNS TABLE (
  id uuid,
  last_active_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.last_active_at
  FROM public.instructors i
  WHERE i.id = p_instructor_id
    AND i.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_scheduled_lesson_blocks(uuid[], date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_instructor_manual_blocks(uuid[], timestamptz, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_instructor_booking_preferences(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_instructor_presence(uuid) TO anon, authenticated;