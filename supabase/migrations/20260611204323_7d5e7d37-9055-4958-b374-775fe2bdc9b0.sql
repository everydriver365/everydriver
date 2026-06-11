CREATE OR REPLACE FUNCTION public.user_owns_school(_user uuid, _school uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = _school AND owner_user_id = _user
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_school(uuid, uuid) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "School owners can manage school instructors" ON public.school_instructors;
CREATE POLICY "School owners can manage school instructors"
  ON public.school_instructors
  FOR ALL
  TO authenticated
  USING (public.user_owns_school(auth.uid(), school_id))
  WITH CHECK (public.user_owns_school(auth.uid(), school_id));
