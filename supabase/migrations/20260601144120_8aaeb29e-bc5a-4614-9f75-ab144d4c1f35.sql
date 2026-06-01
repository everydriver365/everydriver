CREATE OR REPLACE FUNCTION public.auto_log_mileage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if session has a plausible distance and is being ended.
  -- Cap at 500 km per session to reject GPS-jump / first-fix glitches
  -- that previously inserted ~18,000 km phantom trips.
  IF NEW.ended_at IS NOT NULL
     AND OLD.ended_at IS NULL
     AND NEW.total_distance_km > 0.1
     AND NEW.total_distance_km <= 500 THEN
    INSERT INTO public.mileage_logs (
      instructor_id, telematics_id, vehicle_id, pupil_id,
      log_date, distance_km, trip_type, purpose, is_auto_logged
    ) VALUES (
      NEW.instructor_id, NEW.id, NULL, NEW.pupil_id,
      COALESCE(NEW.started_at::date, CURRENT_DATE),
      NEW.total_distance_km,
      CASE WHEN NEW.pupil_id IS NOT NULL THEN 'business' ELSE 'personal' END,
      CASE WHEN NEW.pupil_id IS NOT NULL THEN 'Driving lesson' ELSE 'GPS tracked journey' END,
      true
    );
  ELSIF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL AND NEW.total_distance_km > 500 THEN
    RAISE NOTICE 'auto_log_mileage: skipping implausible distance % km for telematics %', NEW.total_distance_km, NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;