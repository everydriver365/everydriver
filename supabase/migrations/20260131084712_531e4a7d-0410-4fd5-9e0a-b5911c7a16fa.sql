CREATE OR REPLACE FUNCTION increment_total_distance(p_id uuid, p_distance float8)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE lesson_telematics
  SET total_distance_km = COALESCE(total_distance_km, 0) + p_distance
  WHERE id = p_id;
END;
$$;