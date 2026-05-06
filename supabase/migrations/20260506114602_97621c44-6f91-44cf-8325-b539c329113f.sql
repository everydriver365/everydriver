-- 1. Add speed_limit_kmh to phone_live_positions
ALTER TABLE public.phone_live_positions
  ADD COLUMN IF NOT EXISTS speed_limit_kmh numeric;

-- 2. Replace upsert_phone_live_position with new optional speed_limit_kmh param
CREATE OR REPLACE FUNCTION public.upsert_phone_live_position(
  p_pupil_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_speed_kmh numeric DEFAULT 0,
  p_heading numeric DEFAULT NULL,
  p_accuracy numeric DEFAULT NULL,
  p_battery_level numeric DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_provider text DEFAULT 'phone',
  p_speed_limit_kmh numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instructor_id uuid;
  v_caller_instructor uuid;
  v_id uuid;
BEGIN
  SELECT instructor_id INTO v_instructor_id
  FROM public.pupils
  WHERE id = p_pupil_id;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());
  IF v_caller_instructor IS NULL OR v_caller_instructor <> v_instructor_id THEN
    RAISE EXCEPTION 'Not authorised to update this pupil position';
  END IF;

  INSERT INTO public.phone_live_positions (
    pupil_id, instructor_id, session_id,
    latitude, longitude, speed_kmh, heading, accuracy,
    battery_level, provider, speed_limit_kmh, recorded_at
  ) VALUES (
    p_pupil_id, v_instructor_id, p_session_id,
    p_latitude, p_longitude, p_speed_kmh, p_heading, p_accuracy,
    p_battery_level, COALESCE(p_provider, 'phone'), p_speed_limit_kmh, now()
  )
  ON CONFLICT (pupil_id) DO UPDATE SET
    instructor_id = EXCLUDED.instructor_id,
    session_id = EXCLUDED.session_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed_kmh = EXCLUDED.speed_kmh,
    heading = EXCLUDED.heading,
    accuracy = EXCLUDED.accuracy,
    battery_level = EXCLUDED.battery_level,
    provider = EXCLUDED.provider,
    speed_limit_kmh = EXCLUDED.speed_limit_kmh,
    recorded_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- 3. New: record_phone_gps_point — inserts into telematics_gps_points and bumps distance
CREATE OR REPLACE FUNCTION public.record_phone_gps_point(
  p_session_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_speed_kmh numeric DEFAULT NULL,
  p_heading numeric DEFAULT NULL,
  p_accuracy numeric DEFAULT NULL,
  p_speed_limit_kmh numeric DEFAULT NULL,
  p_road_name text DEFAULT NULL,
  p_distance_delta_km numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instructor_id uuid;
  v_caller_instructor uuid;
  v_point_id uuid;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Session id required';
  END IF;

  SELECT instructor_id INTO v_instructor_id
  FROM public.lesson_telematics
  WHERE id = p_session_id;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Telematics session not found';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());
  IF v_caller_instructor IS NULL OR v_caller_instructor <> v_instructor_id THEN
    RAISE EXCEPTION 'Not authorised for this session';
  END IF;

  INSERT INTO public.telematics_gps_points (
    telematics_id, latitude, longitude, speed_kmh, heading,
    accuracy_m, gps_accuracy_m, speed_limit_kmh, road_name,
    is_speeding, recorded_at
  ) VALUES (
    p_session_id, p_latitude, p_longitude, p_speed_kmh, p_heading,
    p_accuracy, p_accuracy, p_speed_limit_kmh, p_road_name,
    CASE WHEN p_speed_limit_kmh IS NOT NULL AND p_speed_kmh IS NOT NULL
         THEN p_speed_kmh > p_speed_limit_kmh + 5 ELSE false END,
    now()
  )
  RETURNING id INTO v_point_id;

  IF p_distance_delta_km IS NOT NULL AND p_distance_delta_km > 0 THEN
    UPDATE public.lesson_telematics
    SET total_distance_km = COALESCE(total_distance_km, 0) + p_distance_delta_km
    WHERE id = p_session_id;
  END IF;

  RETURN v_point_id;
END;
$function$;