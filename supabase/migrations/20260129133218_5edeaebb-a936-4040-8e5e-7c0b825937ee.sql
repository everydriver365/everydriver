-- Remove overly-broad trigger that fires on ANY UPDATE (including google_event_id updates)
-- This was causing the queue processor to re-queue lessons in a loop.

DROP TRIGGER IF EXISTS sync_lesson_to_google_calendar ON public.scheduled_lessons;

-- Ensure the intended, column-scoped triggers exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='scheduled_lessons' AND tg.tgname='on_lesson_insert_sync_calendar'
  ) THEN
    CREATE TRIGGER on_lesson_insert_sync_calendar
      AFTER INSERT ON public.scheduled_lessons
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_calendar_sync();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='scheduled_lessons' AND tg.tgname='on_lesson_update_sync_calendar'
  ) THEN
    CREATE TRIGGER on_lesson_update_sync_calendar
      AFTER UPDATE OF lesson_date, start_time, duration_minutes, status, pickup_location ON public.scheduled_lessons
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_calendar_sync();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='scheduled_lessons' AND tg.tgname='on_lesson_delete_sync_calendar'
  ) THEN
    CREATE TRIGGER on_lesson_delete_sync_calendar
      AFTER DELETE ON public.scheduled_lessons
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_calendar_sync();
  END IF;
END $$;