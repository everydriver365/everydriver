
ALTER TABLE public.scheduled_lessons
  DROP CONSTRAINT IF EXISTS scheduled_lessons_calendar_sync_status_check;

ALTER TABLE public.scheduled_lessons
  ADD CONSTRAINT scheduled_lessons_calendar_sync_status_check
  CHECK (calendar_sync_status IN ('pending','synced','failed','no-calendar','deleted-from-google'));
