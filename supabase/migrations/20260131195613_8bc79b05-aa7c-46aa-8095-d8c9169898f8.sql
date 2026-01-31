-- Fix the auto_log_mileage trigger to not reference vehicle_id 
-- since lesson_telematics table does not have this column

CREATE OR REPLACE FUNCTION public.auto_log_mileage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if session has distance and is being ended
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL AND NEW.total_distance_km > 0.1 THEN
    INSERT INTO public.mileage_logs (
      instructor_id,
      telematics_id,
      vehicle_id,
      pupil_id,
      log_date,
      distance_km,
      trip_type,
      purpose,
      is_auto_logged
    ) VALUES (
      NEW.instructor_id,
      NEW.id,
      NULL, -- vehicle_id is not available in lesson_telematics table
      NEW.pupil_id,
      COALESCE(NEW.started_at::date, CURRENT_DATE),
      NEW.total_distance_km,
      CASE WHEN NEW.pupil_id IS NOT NULL THEN 'business' ELSE 'personal' END,
      CASE 
        WHEN NEW.pupil_id IS NOT NULL THEN 'Driving lesson'
        ELSE 'GPS tracked journey'
      END,
      true
    );
  END IF;
  RETURN NEW;
END;
$function$;