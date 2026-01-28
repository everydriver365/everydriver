-- Add speed_limit_kmh column to live_pupil_positions table for real-time speed limit display
ALTER TABLE public.live_pupil_positions 
ADD COLUMN IF NOT EXISTS speed_limit_kmh NUMERIC;

-- Update the update_live_position function to accept and store speed limit
CREATE OR REPLACE FUNCTION public.update_live_position(
  p_pupil_id uuid, 
  p_latitude numeric, 
  p_longitude numeric, 
  p_speed_kmh numeric DEFAULT 0, 
  p_heading numeric DEFAULT NULL::numeric, 
  p_accuracy numeric DEFAULT NULL::numeric, 
  p_trip_status text DEFAULT 'driving'::text, 
  p_session_id uuid DEFAULT NULL::uuid,
  p_speed_limit_kmh numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instructor_id UUID;
  v_position_id UUID;
BEGIN
  -- Get instructor ID for this pupil
  SELECT instructor_id INTO v_instructor_id FROM public.pupils WHERE id = p_pupil_id;
  
  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;
  
  -- Upsert the live position
  INSERT INTO public.live_pupil_positions (
    pupil_id, instructor_id, telematics_session_id,
    latitude, longitude, speed_kmh, heading, accuracy,
    trip_status, is_active, updated_at, speed_limit_kmh
  ) VALUES (
    p_pupil_id, v_instructor_id, p_session_id,
    p_latitude, p_longitude, p_speed_kmh, p_heading, p_accuracy,
    p_trip_status, true, now(), p_speed_limit_kmh
  )
  ON CONFLICT (pupil_id) WHERE is_active = true
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed_kmh = EXCLUDED.speed_kmh,
    heading = EXCLUDED.heading,
    accuracy = EXCLUDED.accuracy,
    trip_status = EXCLUDED.trip_status,
    telematics_session_id = EXCLUDED.telematics_session_id,
    speed_limit_kmh = EXCLUDED.speed_limit_kmh,
    updated_at = now()
  RETURNING id INTO v_position_id;
  
  RETURN v_position_id;
END;
$function$;