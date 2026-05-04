
DROP VIEW IF EXISTS public.famulor_daily_stats;
CREATE VIEW public.famulor_daily_stats
WITH (security_invoker = true)
AS
SELECT
  instructor_id,
  date_trunc('day', created_at)::date AS day,
  direction,
  purpose,
  COUNT(*) AS call_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE status = 'no_answer') AS no_answer_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COALESCE(SUM(duration_seconds), 0) AS total_duration_seconds,
  COALESCE(SUM(cost_pence), 0) AS total_cost_pence
FROM public.famulor_call_logs
GROUP BY instructor_id, date_trunc('day', created_at), direction, purpose;

GRANT SELECT ON public.famulor_daily_stats TO authenticated;
