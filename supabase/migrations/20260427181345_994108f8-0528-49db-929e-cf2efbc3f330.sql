-- Admin-only view into cron.job for the Edge Function Audit page.
CREATE OR REPLACE FUNCTION public.audit_list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  RETURN QUERY
    SELECT j.jobid, j.jobname, j.schedule, j.command, j.active
    FROM cron.job j
    ORDER BY j.jobid;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_list_cron_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_list_cron_jobs() TO authenticated;