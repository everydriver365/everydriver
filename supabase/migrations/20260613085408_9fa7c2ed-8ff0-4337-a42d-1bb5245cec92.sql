DROP FUNCTION IF EXISTS public.get_public_instructor_booking_preferences(uuid);

CREATE OR REPLACE FUNCTION public.get_public_instructor_booking_preferences(p_instructor_id uuid)
RETURNS TABLE(
  id uuid,
  prefer_earliest_slot boolean,
  available_from date,
  buffer_minutes integer,
  slot_increment_minutes integer,
  is_network_placeholder boolean,
  preferred_lesson_length integer,
  allowed_lesson_lengths integer[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    i.id,
    COALESCE(i.prefer_earliest_slot, false) AS prefer_earliest_slot,
    i.available_from,
    i.buffer_minutes,
    i.slot_increment_minutes,
    COALESCE(i.is_network_placeholder, false) AS is_network_placeholder,
    i.preferred_lesson_length,
    i.allowed_lesson_lengths
  FROM public.instructors i
  WHERE i.id = p_instructor_id
    AND i.is_active = true
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_instructor_booking_preferences(uuid) TO anon, authenticated, service_role;