-- Drop Nylas-related table and dependencies
DROP TRIGGER IF EXISTS update_instructor_nylas_grants_updated_at ON public.instructor_nylas_grants;
DROP TABLE IF EXISTS public.instructor_nylas_grants;