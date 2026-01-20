-- Enable pg_net for HTTP calls (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to trigger calendar sync when a lesson is created/updated/deleted
CREATE OR REPLACE FUNCTION public.trigger_calendar_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  instructor_id_val UUID;
  lesson_id_val UUID;
  action_type TEXT;
BEGIN
  -- Determine the instructor_id and action based on operation
  IF TG_OP = 'DELETE' THEN
    instructor_id_val := OLD.instructor_id;
    lesson_id_val := OLD.id;
    action_type := 'deleteLesson';
  ELSE
    instructor_id_val := NEW.instructor_id;
    lesson_id_val := NEW.id;
    action_type := 'syncLesson';
  END IF;

  -- Queue the HTTP request to the calendar-sync edge function using net.http_post
  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/calendar-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object(
      'action', action_type,
      'instructorId', instructor_id_val::text,
      'lessonId', lesson_id_val::text
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers on scheduled_lessons table
DROP TRIGGER IF EXISTS on_lesson_insert_sync_calendar ON public.scheduled_lessons;
CREATE TRIGGER on_lesson_insert_sync_calendar
  AFTER INSERT ON public.scheduled_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calendar_sync();

DROP TRIGGER IF EXISTS on_lesson_update_sync_calendar ON public.scheduled_lessons;
CREATE TRIGGER on_lesson_update_sync_calendar
  AFTER UPDATE OF lesson_date, start_time, duration_minutes, status, pickup_location ON public.scheduled_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calendar_sync();

DROP TRIGGER IF EXISTS on_lesson_delete_sync_calendar ON public.scheduled_lessons;
CREATE TRIGGER on_lesson_delete_sync_calendar
  AFTER DELETE ON public.scheduled_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calendar_sync();