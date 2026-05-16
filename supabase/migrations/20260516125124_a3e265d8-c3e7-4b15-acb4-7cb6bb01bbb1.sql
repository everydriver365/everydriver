CREATE OR REPLACE FUNCTION public.get_public_instructor_calendar_blocks(
  p_instructor_ids uuid[],
  p_from_datetime timestamp with time zone,
  p_to_datetime timestamp with time zone
)
RETURNS TABLE(
  instructor_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_busy boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ce.instructor_id, ce.start_time, ce.end_time, ce.is_busy
  FROM public.instructor_calendar_events ce
  JOIN public.instructors i ON i.id = ce.instructor_id
  WHERE i.is_active = true
    AND ce.instructor_id = ANY(p_instructor_ids)
    AND ce.is_busy = true
    AND ce.end_time >= p_from_datetime
    AND ce.start_time <= p_to_datetime;
$$;