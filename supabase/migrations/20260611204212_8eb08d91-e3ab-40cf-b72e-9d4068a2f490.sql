-- Fix infinite recursion between schools <-> school_instructors RLS policies.
-- A SECURITY DEFINER helper avoids the recursive policy evaluation.

CREATE OR REPLACE FUNCTION public.user_is_school_member(_user uuid, _school uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_instructors si
    JOIN public.instructors i ON i.id = si.instructor_id
    WHERE si.school_id = _school
      AND i.auth_user_id = _user
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_is_school_member(uuid, uuid) TO authenticated, anon, service_role;

-- Rebuild the schools SELECT policy without subselecting school_instructors directly.
DROP POLICY IF EXISTS "School members can view their school" ON public.schools;
CREATE POLICY "School members can view their school"
  ON public.schools
  FOR SELECT
  TO authenticated
  USING (public.user_is_school_member(auth.uid(), id));
