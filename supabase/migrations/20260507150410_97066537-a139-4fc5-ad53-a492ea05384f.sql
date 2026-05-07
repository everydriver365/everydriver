
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS clash_overridden boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.prevent_lesson_clash()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_start_min int;
  v_new_end_min   int;
  v_clash record;
  v_lock_key bigint;
BEGIN
  IF NEW.status = 'cancelled' OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.clash_overridden, false) THEN
    RETURN NEW;
  END IF;

  IF NEW.start_time IS NULL OR NEW.duration_minutes IS NULL OR NEW.lesson_date IS NULL THEN
    RETURN NEW;
  END IF;

  v_lock_key := hashtextextended(
    NEW.instructor_id::text || ':' || NEW.lesson_date::text,
    0
  );
  PERFORM pg_advisory_xact_lock(v_lock_key);

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
$function$;
