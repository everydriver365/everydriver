CREATE OR REPLACE FUNCTION public.prevent_lesson_for_deleted_pupil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pupil_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.pupils
    WHERE id = NEW.pupil_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot book a lesson against an archived pupil'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_lesson_for_deleted_pupil ON public.scheduled_lessons;
CREATE TRIGGER trg_prevent_lesson_for_deleted_pupil
BEFORE INSERT OR UPDATE OF pupil_id ON public.scheduled_lessons
FOR EACH ROW EXECUTE FUNCTION public.prevent_lesson_for_deleted_pupil();