CREATE OR REPLACE FUNCTION public.auto_request_lesson_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instructor_name TEXT;
  v_feedback_enabled BOOLEAN;
BEGIN
  -- Respect instructor opt-out: skip feedback row if disabled.
  SELECT COALESCE(lesson_feedback_enabled, true), name
    INTO v_feedback_enabled, v_instructor_name
    FROM public.instructors
   WHERE id = NEW.instructor_id;

  IF COALESCE(v_feedback_enabled, true) THEN
    INSERT INTO public.lesson_feedback (
      lesson_history_id, pupil_id, instructor_id, requested_at
    ) VALUES (
      NEW.id, NEW.pupil_id, NEW.instructor_id, now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Fire LESSON_COMPLETED push (non-blocking via pg_net)
  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-pupil',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object(
      'pupilId', NEW.pupil_id::text,
      'type', 'lesson_completed',
      'data', jsonb_build_object(
        'type', 'lesson_completed',
        'lessonHistoryId', NEW.id::text,
        'instructorName', COALESCE(v_instructor_name, 'your instructor')
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_request_lesson_feedback failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;