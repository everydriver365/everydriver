CREATE OR REPLACE FUNCTION public.get_whitelabel_instructor_status(p_slug text)
RETURNS TABLE (id uuid, name text, is_active boolean, available_from date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, is_active, available_from
  FROM public.instructors
  WHERE app_slug = p_slug
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_whitelabel_instructor_status(text) TO anon, authenticated;