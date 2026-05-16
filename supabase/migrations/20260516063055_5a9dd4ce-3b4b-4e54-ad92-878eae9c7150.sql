CREATE OR REPLACE FUNCTION public.browse_public_test_swaps_by_postcode(
  p_lat numeric DEFAULT NULL,
  p_lng numeric DEFAULT NULL,
  p_radius_mi numeric DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  first_name text,
  current_centre_id uuid,
  current_centre_name text,
  current_test_date date,
  current_test_time time without time zone,
  earliest_new_date date,
  latest_new_date date,
  notes text,
  created_at timestamp with time zone,
  distance_miles numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    s.created_at,
    CASE
      WHEN p_lat IS NULL OR p_lng IS NULL OR tc.lat IS NULL OR tc.lng IS NULL THEN NULL
      ELSE round(
        (3958.7613 * 2 * asin(sqrt(
          power(sin(radians((tc.lat - p_lat) / 2)), 2) +
          cos(radians(p_lat)) * cos(radians(tc.lat)) *
          power(sin(radians((tc.lng - p_lng) / 2)), 2)
        )))::numeric,
        2
      )
    END AS distance_miles
  FROM public.public_test_swap_signups s
  LEFT JOIN public.test_centres tc ON tc.id = s.current_centre_id
  WHERE s.status = 'pending'
    AND s.has_test_booked = true
    AND s.current_test_date IS NOT NULL
    AND s.current_test_date >= CURRENT_DATE
    AND (
      p_lat IS NULL OR p_lng IS NULL OR p_radius_mi IS NULL
      OR (
        tc.lat IS NOT NULL AND tc.lng IS NOT NULL
        AND (3958.7613 * 2 * asin(sqrt(
          power(sin(radians((tc.lat - p_lat) / 2)), 2) +
          cos(radians(p_lat)) * cos(radians(tc.lat)) *
          power(sin(radians((tc.lng - p_lng) / 2)), 2)
        ))) <= p_radius_mi
      )
    )
  ORDER BY
    CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
      THEN (3958.7613 * 2 * asin(sqrt(
        power(sin(radians((tc.lat - p_lat) / 2)), 2) +
        cos(radians(p_lat)) * cos(radians(tc.lat)) *
        power(sin(radians((tc.lng - p_lng) / 2)), 2)
      )))
      ELSE NULL
    END ASC NULLS LAST,
    s.current_test_date ASC,
    s.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
$function$;

GRANT EXECUTE ON FUNCTION public.browse_public_test_swaps_by_postcode(numeric, numeric, numeric, integer) TO anon, authenticated;