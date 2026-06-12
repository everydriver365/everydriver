
-- Job Alerts: fan-out enquiry alerts to instructor_notifications + admin_alerts
-- Plus enable realtime on the new tables.

CREATE OR REPLACE FUNCTION public.fan_out_enquiry_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id uuid;
  v_pupil_name text;
  v_postcode text;
  v_hours numeric;
  v_transmission text;
  v_source text;
  v_msg text;
  v_action_url text;
BEGIN
  IF TG_TABLE_NAME = 'booking_enquiries' THEN
    v_instructor_id := NEW.instructor_id;
    v_pupil_name    := NEW.pupil_name;
    v_postcode      := NEW.pupil_postcode;
    v_hours         := NEW.course_hours;
    v_transmission  := NULL;
    v_source        := COALESCE(NEW.source, 'booking_enquiry');
    v_action_url    := '/instructor/inbox?tab=enquiries&id=' || NEW.id::text;
  ELSIF TG_TABLE_NAME = 'course_enquiries' THEN
    v_instructor_id := NEW.assigned_instructor_id;
    v_pupil_name    := NEW.name;
    v_postcode      := NEW.postcode;
    v_hours         := NEW.requested_hours;
    v_transmission  := NEW.transmission_type;
    v_source        := 'course_enquiry';
    v_action_url    := '/instructor/inbox?tab=jobs&id=' || NEW.id::text;
  ELSE
    RETURN NEW;
  END IF;

  v_msg := COALESCE(v_pupil_name, 'New enquiry')
        || CASE WHEN v_hours IS NOT NULL THEN ' · ' || v_hours::text || 'h' ELSE '' END
        || CASE WHEN v_transmission IS NOT NULL THEN ' ' || initcap(v_transmission) ELSE '' END
        || CASE WHEN v_postcode IS NOT NULL THEN ' · ' || v_postcode ELSE '' END;

  -- Instructor-facing Job Alert
  IF v_instructor_id IS NOT NULL THEN
    INSERT INTO public.instructor_notifications
      (instructor_id, title, message, type, is_read, action_url, metadata)
    VALUES
      (v_instructor_id, 'New Job Alert', v_msg, 'job_offer', false, v_action_url,
       jsonb_build_object(
         'source_table', TG_TABLE_NAME,
         'source_id', NEW.id,
         'source', v_source,
         'postcode', v_postcode,
         'hours', v_hours
       ));
  END IF;

  -- Admin alert (always, even when unrouted)
  INSERT INTO public.admin_alerts
    (alert_type, instructor_id, message, metadata, is_read)
  VALUES
    ('enquiry', v_instructor_id,
     CASE WHEN v_instructor_id IS NULL
          THEN 'Unrouted enquiry: ' || v_msg
          ELSE 'New enquiry: ' || v_msg END,
     jsonb_build_object(
       'source_table', TG_TABLE_NAME,
       'source_id', NEW.id,
       'source', v_source,
       'pupil_name', v_pupil_name,
       'postcode', v_postcode,
       'hours', v_hours,
       'action_url', v_action_url
     ),
     false);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fan_out_booking_enquiry_alert ON public.booking_enquiries;
CREATE TRIGGER trg_fan_out_booking_enquiry_alert
AFTER INSERT ON public.booking_enquiries
FOR EACH ROW EXECUTE FUNCTION public.fan_out_enquiry_alert();

DROP TRIGGER IF EXISTS trg_fan_out_course_enquiry_alert ON public.course_enquiries;
CREATE TRIGGER trg_fan_out_course_enquiry_alert
AFTER INSERT ON public.course_enquiries
FOR EACH ROW EXECUTE FUNCTION public.fan_out_enquiry_alert();

-- Add to realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='admin_alerts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts';
  END IF;
END $$;
