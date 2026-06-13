CREATE OR REPLACE FUNCTION public.get_my_pupil_portal_slug()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.app_slug
  FROM public.pupils p
  JOIN public.instructors i ON i.id = p.instructor_id
  WHERE p.auth_user_id = auth.uid()
    AND p.deleted_at IS NULL
    AND i.app_slug IS NOT NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pupil_portal_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_pupil_portal_slug() TO service_role;