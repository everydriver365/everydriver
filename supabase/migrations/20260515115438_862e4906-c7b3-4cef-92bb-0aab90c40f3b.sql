CREATE OR REPLACE FUNCTION public.get_public_test_swap_signup_for_edit(p_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  current_centre_id uuid,
  current_centre_name text,
  current_test_date date,
  current_test_time time,
  has_test_booked boolean,
  earliest_new_date date,
  latest_new_date date,
  notes text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.full_name, s.email, s.phone, s.current_centre_id, s.current_centre_name,
         s.current_test_date, s.current_test_time, s.has_test_booked,
         s.earliest_new_date, s.latest_new_date, s.notes
  FROM public.public_test_swap_signups s
  WHERE s.id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_test_swap_signup_for_edit(uuid) TO anon, authenticated;