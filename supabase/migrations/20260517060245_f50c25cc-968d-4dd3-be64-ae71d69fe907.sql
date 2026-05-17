
-- 1. Update trigger so soft-delete or status->cancelled enqueues deleteLesson
CREATE OR REPLACE FUNCTION public.trigger_calendar_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_instructor_id uuid;
  v_lesson_id uuid;
  v_action text;
  v_became_deleted boolean := false;
  v_became_cancelled boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_instructor_id := OLD.instructor_id;
    v_lesson_id := OLD.id;
    v_action := 'deleteLesson';
  ELSE
    v_instructor_id := NEW.instructor_id;
    v_lesson_id := NEW.id;

    IF TG_OP = 'UPDATE' THEN
      v_became_deleted := (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL);
      v_became_cancelled := (COALESCE(OLD.status,'') <> 'cancelled' AND NEW.status = 'cancelled');
    END IF;

    IF v_became_deleted OR v_became_cancelled THEN
      v_action := 'deleteLesson';
    ELSE
      -- Skip if already soft-deleted/cancelled — no work to enqueue
      IF NEW.deleted_at IS NOT NULL OR NEW.status = 'cancelled' THEN
        RETURN NEW;
      END IF;
      v_action := 'syncLesson';
    END IF;
  END IF;

  INSERT INTO public.calendar_sync_queue (instructor_id, lesson_id, action)
  VALUES (v_instructor_id, v_lesson_id, v_action);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Cleanup: re-enqueue deleteLesson for orphan rows that are cancelled or
-- soft-deleted but still carry a google_event_id (mirror could still block).
INSERT INTO public.calendar_sync_queue (instructor_id, lesson_id, action)
SELECT instructor_id, id, 'deleteLesson'
FROM public.scheduled_lessons
WHERE google_event_id IS NOT NULL
  AND (deleted_at IS NOT NULL OR status = 'cancelled');
