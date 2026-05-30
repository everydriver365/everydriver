CREATE OR REPLACE FUNCTION public.delete_pupil_permanently(
  p_pupil_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_instructor uuid;
  v_pupil_instructor  uuid;
  v_deleted_at        timestamptz;
BEGIN
  SELECT instructor_id, deleted_at
    INTO v_pupil_instructor, v_deleted_at
  FROM public.pupils WHERE id = p_pupil_id;

  IF v_pupil_instructor IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;

  IF v_deleted_at IS NULL THEN
    RAISE EXCEPTION 'Pupil must be archived before permanent deletion';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());

  IF NOT (
       v_caller_instructor = v_pupil_instructor
       OR public.has_role(auth.uid(), 'admin'::app_role)
     ) THEN
    RAISE EXCEPTION 'Not authorised to delete this pupil';
  END IF;

  DELETE FROM public.pupils WHERE id = p_pupil_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pupil_permanently(uuid) TO authenticated;