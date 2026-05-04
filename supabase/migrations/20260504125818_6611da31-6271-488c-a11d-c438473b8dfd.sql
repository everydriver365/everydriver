
ALTER TABLE public.famulor_call_logs
  ADD COLUMN IF NOT EXISTS cost_pence INTEGER,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS from_number TEXT,
  ADD COLUMN IF NOT EXISTS to_number TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

CREATE POLICY "School owners view famulor call logs"
ON public.famulor_call_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.school_instructors si
    JOIN public.schools s ON s.id = si.school_id
    WHERE si.instructor_id = famulor_call_logs.instructor_id
      AND s.owner_user_id = auth.uid()
  )
);

CREATE POLICY "School owners view famulor settings"
ON public.famulor_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.school_instructors si
    JOIN public.schools s ON s.id = si.school_id
    WHERE si.instructor_id = famulor_settings.instructor_id
      AND s.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins view all famulor call logs"
ON public.famulor_call_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins view all famulor settings"
ON public.famulor_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.famulor_call_logs REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'famulor_call_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.famulor_call_logs';
  END IF;
END $$;

CREATE OR REPLACE VIEW public.famulor_daily_stats AS
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
