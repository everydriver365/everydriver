-- Create function for detecting harsh events from motion data
CREATE OR REPLACE FUNCTION public.check_motion_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process significant G-force events (> 0.4g indicates harsh maneuver)
  IF NEW.g_force IS NOT NULL AND NEW.g_force > 0.4 THEN
    -- Determine severity based on G-force
    INSERT INTO public.telematics_alerts (
      telematics_id, 
      alert_type, 
      severity,
      latitude,
      longitude
    )
    SELECT 
      NEW.telematics_id,
      CASE 
        WHEN NEW.acceleration_z < -3 THEN 'harsh_brake'
        WHEN NEW.acceleration_z > 3 THEN 'harsh_accel'
        WHEN ABS(NEW.acceleration_x) > 3 OR ABS(NEW.acceleration_y) > 3 THEN 'sharp_turn'
        ELSE 'harsh_brake' -- Default
      END,
      CASE 
        WHEN NEW.g_force > 0.8 THEN 'high'
        WHEN NEW.g_force > 0.6 THEN 'medium'
        ELSE 'low'
      END,
      gps.latitude,
      gps.longitude
    FROM public.telematics_gps_points gps
    WHERE gps.telematics_id = NEW.telematics_id
    ORDER BY gps.recorded_at DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for motion-based alert detection
DROP TRIGGER IF EXISTS motion_alert_check ON public.telematics_motion_raw;
CREATE TRIGGER motion_alert_check
AFTER INSERT ON public.telematics_motion_raw
FOR EACH ROW EXECUTE FUNCTION public.check_motion_alerts();