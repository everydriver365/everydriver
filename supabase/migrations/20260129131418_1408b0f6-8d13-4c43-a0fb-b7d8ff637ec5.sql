-- Create trigger to sync lessons to Google Calendar
CREATE TRIGGER sync_lesson_to_google_calendar
  AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calendar_sync();