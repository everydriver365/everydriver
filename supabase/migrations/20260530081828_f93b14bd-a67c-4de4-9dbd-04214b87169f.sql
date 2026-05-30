CREATE OR REPLACE FUNCTION public.archive_pupil(
  p_pupil_id uuid,
  p_reason   text,
  p_note     text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_instructor uuid;
  v_pupil_instructor  uuid;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Archive reason is required';
  END IF;

  SELECT instructor_id INTO v_pupil_instructor
  FROM public.pupils WHERE id = p_pupil_id;

  IF v_pupil_instructor IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());

  IF NOT (
       v_caller_instructor = v_pupil_instructor
       OR public.has_role(auth.uid(), 'admin'::app_role)
     ) THEN
    RAISE EXCEPTION 'Not authorised to archive this pupil';
  END IF;

  UPDATE public.pupils
     SET deleted_at     = COALESCE(deleted_at, now()),
         archive_reason = p_reason,
         archive_note   = NULLIF(trim(COALESCE(p_note,'')), '')
   WHERE id = p_pupil_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_pupil(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_pupil(
  p_pupil_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_instructor uuid;
  v_pupil_instructor  uuid;
BEGIN
  SELECT instructor_id INTO v_pupil_instructor
  FROM public.pupils WHERE id = p_pupil_id;

  IF v_pupil_instructor IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());

  IF NOT (
       v_caller_instructor = v_pupil_instructor
       OR public.has_role(auth.uid(), 'admin'::app_role)
     ) THEN
    RAISE EXCEPTION 'Not authorised to restore this pupil';
  END IF;

  UPDATE public.pupils
     SET deleted_at     = NULL,
         archive_reason = NULL,
         archive_note   = NULL
   WHERE id = p_pupil_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_pupil(uuid) TO authenticated;

DROP POLICY IF EXISTS "Instructors delete own pupils" ON public.pupils;
REVOKE DELETE ON public.pupils FROM authenticated, anon;