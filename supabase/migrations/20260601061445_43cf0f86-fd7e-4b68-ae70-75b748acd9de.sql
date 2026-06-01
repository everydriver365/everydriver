CREATE OR REPLACE FUNCTION public.quotes_log_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.quote_activity_log (quote_id, event, actor_type, actor_id, metadata)
    VALUES (NEW.id, 'created', 'instructor', NEW.instructor_id, jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.quote_activity_log (quote_id, event, actor_type, actor_id, metadata)
    VALUES (
      NEW.id,
      NEW.status::text,
      CASE WHEN NEW.status IN ('viewed','accepted','declined') THEN 'pupil'
           WHEN NEW.status = 'expired' THEN 'system'
           ELSE 'instructor' END,
      NULL,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END $function$;

COMMENT ON TABLE public.quote_activity_log IS 'Audit log written exclusively by quotes_log_status_change trigger (SECURITY DEFINER). No client INSERT policy by design.';