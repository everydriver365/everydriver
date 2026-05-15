CREATE OR REPLACE FUNCTION public.browse_public_test_swaps(
  p_centre_id uuid DEFAULT NULL,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL,
  p_limit int DEFAULT 100
) RETURNS TABLE(
  id uuid,
  first_name text,
  current_centre_id uuid,
  current_centre_name text,
  current_test_date date,
  current_test_time time,
  earliest_new_date date,
  latest_new_date date,
  notes text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    split_part(trim(s.full_name), ' ', 1) AS first_name,
    s.current_centre_id,
    s.current_centre_name,
    s.current_test_date,
    s.current_test_time,
    s.earliest_new_date,
    s.latest_new_date,
    s.notes,
    s.created_at
  FROM public.public_test_swap_signups s
  WHERE s.status = 'pending'
    AND s.has_test_booked = true
    AND s.current_test_date IS NOT NULL
    AND s.current_test_date >= CURRENT_DATE
    AND (p_centre_id IS NULL OR s.current_centre_id = p_centre_id)
    AND (p_from_date IS NULL OR s.current_test_date >= p_from_date)
    AND (p_to_date IS NULL OR s.current_test_date <= p_to_date)
  ORDER BY s.current_test_date ASC, s.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
$$;

GRANT EXECUTE ON FUNCTION public.browse_public_test_swaps(uuid, date, date, int) TO anon, authenticated;