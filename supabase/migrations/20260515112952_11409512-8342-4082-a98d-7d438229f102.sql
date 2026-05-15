CREATE OR REPLACE FUNCTION public.get_public_test_swap_signup_self(p_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  current_centre_name text,
  current_test_date date,
  current_test_time time,
  earliest_new_date date,
  latest_new_date date,
  has_test_booked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.full_name, s.current_centre_name, s.current_test_date,
         s.current_test_time, s.earliest_new_date, s.latest_new_date, s.has_test_booked
  FROM public.public_test_swap_signups s
  WHERE s.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_test_swap_signup_self(uuid) TO anon, authenticated;