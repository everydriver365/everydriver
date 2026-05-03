-- Server-side safety net to prevent overlapping lessons for the same instructor.
-- UI still owns buffer / travel-time concerns; this only blocks true time overlap.

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_instructor_date_active
  ON public.scheduled_lessons (instructor_id, lesson_date)
  WHERE status <> 'cancelled' AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.prevent_lesson_clash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_start_min int;
  v_new_end_min   int;
  v_clash record;
BEGIN
  -- Skip cancelled / soft-deleted rows entirely.
  IF NEW.status = 'cancelled' OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.start_time IS NULL OR NEW.duration_minutes IS NULL OR NEW.lesson_date IS NULL THEN
    RETURN NEW;
  END IF;

  v_new_start_min := EXTRACT(HOUR FROM NEW.start_time)::int * 60
                   + EXTRACT(MINUTE FROM NEW.start_time)::int;
  v_new_end_min   := v_new_start_min + NEW.duration_minutes;

  SELECT
      sl.id,
      sl.start_time,
      sl.duration_minutes
    INTO v_clash
  FROM public.scheduled_lessons sl
  WHERE sl.instructor_id = NEW.instructor_id
    AND sl.lesson_date  = NEW.lesson_date
    AND sl.status      <> 'cancelled'
    AND sl.deleted_at IS NULL
    AND sl.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (EXTRACT(HOUR FROM sl.start_time)::int * 60
         + EXTRACT(MINUTE FROM sl.start_time)::int) < v_new_end_min
    AND (EXTRACT(HOUR FROM sl.start_time)::int * 60
         + EXTRACT(MINUTE FROM sl.start_time)::int
         + sl.duration_minutes) > v_new_start_min
  LIMIT 1;

  IF v_clash.id IS NOT NULL THEN
    RAISE EXCEPTION 'Lesson clash: this instructor already has a lesson at % for % minutes on %',
      v_clash.start_time, v_clash.duration_minutes, NEW.lesson_date
      USING ERRCODE = 'check_violation',
            HINT = 'Cancel or reschedule the existing lesson first.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_lesson_clash_trigger ON public.scheduled_lessons;
CREATE TRIGGER prevent_lesson_clash_trigger
  BEFORE INSERT OR UPDATE OF start_time, duration_minutes, lesson_date, status, deleted_at, instructor_id
  ON public.scheduled_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_lesson_clash();