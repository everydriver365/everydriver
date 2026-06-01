
-- Function to close an open lesson_telematics row and compute aggregates from GPS points
CREATE OR REPLACE FUNCTION public.close_lesson_telematics(p_lesson_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_telematics_id uuid;
  v_ended timestamptz;
  v_distance_km numeric;
  v_avg numeric;
  v_max numeric;
BEGIN
  SELECT id INTO v_telematics_id
  FROM public.lesson_telematics
  WHERE lesson_id = p_lesson_id AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_telematics_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Manual haversine sum (no PostGIS), 3m jitter filter
  WITH ordered AS (
    SELECT recorded_at,
           speed_kmh,
           latitude::float8 AS lat,
           longitude::float8 AS lng,
           LAG(latitude::float8) OVER (ORDER BY recorded_at) AS prev_lat,
           LAG(longitude::float8) OVER (ORDER BY recorded_at) AS prev_lng
    FROM public.telematics_gps_points
    WHERE telematics_id = v_telematics_id
  ),
  deltas AS (
    SELECT recorded_at,
           speed_kmh,
           CASE
             WHEN prev_lat IS NULL THEN 0
             ELSE 2 * 6371000 * asin(
               sqrt(
                 power(sin(radians(lat - prev_lat) / 2), 2)
                 + cos(radians(prev_lat)) * cos(radians(lat))
                   * power(sin(radians(lng - prev_lng) / 2), 2)
               )
             )
           END AS d_m
    FROM ordered
  )
  SELECT
    MAX(recorded_at),
    COALESCE(SUM(CASE WHEN d_m > 3 THEN d_m END) / 1000.0, 0),
    AVG(speed_kmh),
    MAX(speed_kmh)
  INTO v_ended, v_distance_km, v_avg, v_max
  FROM deltas;

  UPDATE public.lesson_telematics
  SET ended_at = COALESCE(v_ended, now()),
      total_distance_km = v_distance_km,
      avg_speed_kmh = v_avg,
      max_speed_kmh = v_max
  WHERE id = v_telematics_id;

  RETURN v_telematics_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_lesson_telematics(uuid) TO authenticated, service_role;

-- Trigger: when a lesson transitions to 'completed', close its open telematics row
CREATE OR REPLACE FUNCTION public.trg_close_telematics_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed' THEN
    PERFORM public.close_lesson_telematics(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_close_telematics_on_lesson_complete ON public.scheduled_lessons;
CREATE TRIGGER trg_close_telematics_on_lesson_complete
AFTER UPDATE ON public.scheduled_lessons
FOR EACH ROW
EXECUTE FUNCTION public.trg_close_telematics_on_complete();
