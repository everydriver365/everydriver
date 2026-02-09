
-- Phase 1: Add planned competencies to scheduled lessons
ALTER TABLE public.scheduled_lessons ADD COLUMN planned_competencies text[];

-- Phase 5: Add competency link to telematics alerts
ALTER TABLE public.telematics_alerts ADD COLUMN related_competency_id text;

-- Update the check_gps_point_alerts trigger to auto-tag alerts with competency IDs
CREATE OR REPLACE FUNCTION public.check_gps_point_alerts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prev_point RECORD;
  time_diff NUMERIC;
BEGIN
  -- Get previous point for this session
  SELECT speed_kmh, speed_limit_kmh, recorded_at INTO prev_point
  FROM public.telematics_gps_points
  WHERE telematics_id = NEW.telematics_id
    AND recorded_at < NEW.recorded_at
  ORDER BY recorded_at DESC
  LIMIT 1;
  
  -- Skip if no previous point or new point has no speed
  IF prev_point IS NULL OR NEW.speed_kmh IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate time difference in seconds
  time_diff := EXTRACT(EPOCH FROM (NEW.recorded_at - prev_point.recorded_at));
  
  -- Skip if points are too far apart (> 10 seconds, likely GPS gap)
  IF time_diff > 10 OR time_diff <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Check speeding (if speed limit known, allow 5 km/h buffer)
  IF NEW.speed_limit_kmh IS NOT NULL AND NEW.speed_kmh > NEW.speed_limit_kmh + 5 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_limit_kmh, 
      speed_delta, latitude, longitude, road_name, related_competency_id
    )
    VALUES (
      NEW.telematics_id, 
      'speeding', 
      CASE 
        WHEN NEW.speed_kmh > NEW.speed_limit_kmh + 20 THEN 'high'
        WHEN NEW.speed_kmh > NEW.speed_limit_kmh + 10 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh, 
      NEW.speed_limit_kmh,
      NEW.speed_kmh - NEW.speed_limit_kmh,
      NEW.latitude, 
      NEW.longitude,
      NEW.road_name,
      'use_of_speed'
    );
  END IF;
  
  -- Check harsh braking (speed drop > 20 km/h in short time)
  IF prev_point.speed_kmh IS NOT NULL AND prev_point.speed_kmh - NEW.speed_kmh > 20 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_delta, latitude, longitude, related_competency_id
    )
    VALUES (
      NEW.telematics_id, 
      'harsh_brake', 
      CASE 
        WHEN prev_point.speed_kmh - NEW.speed_kmh > 35 THEN 'high'
        WHEN prev_point.speed_kmh - NEW.speed_kmh > 25 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh,
      prev_point.speed_kmh - NEW.speed_kmh,
      NEW.latitude, 
      NEW.longitude,
      'following_distance'
    );
  END IF;
  
  -- Check harsh acceleration (speed increase > 15 km/h in short time)
  IF prev_point.speed_kmh IS NOT NULL AND NEW.speed_kmh - prev_point.speed_kmh > 15 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_delta, latitude, longitude, related_competency_id
    )
    VALUES (
      NEW.telematics_id, 
      'harsh_accel', 
      CASE 
        WHEN NEW.speed_kmh - prev_point.speed_kmh > 25 THEN 'high'
        WHEN NEW.speed_kmh - prev_point.speed_kmh > 18 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh,
      NEW.speed_kmh - prev_point.speed_kmh,
      NEW.latitude, 
      NEW.longitude,
      'moving_off'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
