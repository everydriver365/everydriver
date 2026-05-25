CREATE OR REPLACE FUNCTION public.try_lock_lesson_sync(p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try-lock so we never block; returns false if another tx holds the lock.
  RETURN pg_try_advisory_xact_lock(hashtextextended(p_lesson_id::text, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.try_lock_lesson_sync(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_lock_lesson_sync(uuid) TO service_role;