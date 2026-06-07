-- Admin-only function exposing cron job + run health for the sync-related jobs.
CREATE OR REPLACE FUNCTION public.get_sync_cron_health()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_run_start timestamptz,
  last_run_end timestamptz,
  last_status text,
  last_error text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.active,
    r.start_time AS last_run_start,
    r.end_time   AS last_run_end,
    r.status::text AS last_status,
    r.return_message::text AS last_error
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, end_time, status, return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
  ) r ON true
  WHERE
    j.jobname ILIKE '%calendar%'
    OR j.jobname ILIKE '%sync%'
    OR j.jobname ILIKE '%webhook%'
    OR j.jobname ILIKE '%google%';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sync_cron_health() TO authenticated, service_role;