
CREATE OR REPLACE FUNCTION public.get_pupil_payment_info(p_pupil_id uuid, p_instructor_id uuid)
RETURNS TABLE(name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name::text, p.email::text
  FROM public.pupils p
  WHERE p.id = p_pupil_id
    AND p.instructor_id = p_instructor_id
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;
