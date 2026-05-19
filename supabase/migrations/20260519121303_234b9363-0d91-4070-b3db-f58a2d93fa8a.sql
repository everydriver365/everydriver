CREATE OR REPLACE FUNCTION public.cancel_lessons_when_pupil_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.scheduled_lessons sl
       SET deleted_at = COALESCE(sl.deleted_at, NEW.deleted_at, now()),
           status = 'cancelled',
           cancelled_at = COALESCE(sl.cancelled_at, NEW.deleted_at, now()),
           cancelled_by = COALESCE(sl.cancelled_by, 'instructor'),
           cancellation_reason = COALESCE(sl.cancellation_reason, 'Pupil deleted')
     WHERE sl.pupil_id = NEW.id
       AND sl.deleted_at IS NULL
       AND COALESCE(sl.status, '') <> 'cancelled';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS cancel_lessons_when_pupil_deleted_trigger ON public.pupils;
CREATE TRIGGER cancel_lessons_when_pupil_deleted_trigger
AFTER UPDATE OF deleted_at ON public.pupils
FOR EACH ROW
EXECUTE FUNCTION public.cancel_lessons_when_pupil_deleted();

WITH orphaned_lessons AS (
  SELECT sl.id,
         sl.instructor_id,
         sl.google_event_id,
         p.deleted_at AS pupil_deleted_at
    FROM public.scheduled_lessons sl
    JOIN public.pupils p ON p.id = sl.pupil_id
   WHERE p.deleted_at IS NOT NULL
     AND sl.deleted_at IS NULL
     AND COALESCE(sl.status, '') <> 'cancelled'
), cancelled AS (
  UPDATE public.scheduled_lessons sl
     SET deleted_at = COALESCE(ol.pupil_deleted_at, now()),
         status = 'cancelled',
         cancelled_at = COALESCE(sl.cancelled_at, ol.pupil_deleted_at, now()),
         cancelled_by = COALESCE(sl.cancelled_by, 'instructor'),
         cancellation_reason = COALESCE(sl.cancellation_reason, 'Pupil deleted')
    FROM orphaned_lessons ol
   WHERE sl.id = ol.id
   RETURNING ol.instructor_id, ol.google_event_id
)
DELETE FROM public.instructor_calendar_events ice
USING cancelled c
WHERE c.google_event_id IS NOT NULL
  AND ice.instructor_id = c.instructor_id
  AND ice.external_event_id = c.google_event_id;