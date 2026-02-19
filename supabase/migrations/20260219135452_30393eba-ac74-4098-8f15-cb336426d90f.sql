
-- Update cleanup function to also reset session_start_ecu_odometer_km when sessions end
CREATE OR REPLACE FUNCTION public.auto_cleanup_stale_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.lesson_telematics lt
  SET ended_at = now()
  WHERE lt.ended_at IS NULL
    AND lt.started_at < now() - interval '30 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.telematics_gps_points gp
      WHERE gp.telematics_id = lt.id
        AND gp.recorded_at > now() - interval '30 minutes'
    );

  UPDATE public.gps_devices gd
  SET current_session_id = NULL,
      current_pupil_id = NULL,
      session_start_ecu_odometer_km = NULL
  WHERE gd.current_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.lesson_telematics lt
      WHERE lt.id = gd.current_session_id
        AND lt.ended_at IS NOT NULL
    );
END;
$function$;
