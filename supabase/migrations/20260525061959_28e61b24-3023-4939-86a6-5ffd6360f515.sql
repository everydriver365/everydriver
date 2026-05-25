CREATE TABLE IF NOT EXISTS public.google_sync_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  lesson_id uuid,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium')),
  category text NOT NULL CHECK (category IN ('key_decode','auth_401','rate_limit_429','webhook','orphan_lesson','queue_stuck','service_account_missing','other')),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurrence_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_sync_alerts_unresolved
  ON public.google_sync_alerts (severity, last_seen_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_google_sync_alerts_instructor
  ON public.google_sync_alerts (instructor_id, last_seen_at DESC);

-- Partial unique index for dedupe of unresolved alerts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_google_sync_alerts_dedupe
  ON public.google_sync_alerts (
    category,
    COALESCE(instructor_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(lesson_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE resolved_at IS NULL;

ALTER TABLE public.google_sync_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view google sync alerts"
  ON public.google_sync_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert google sync alerts"
  ON public.google_sync_alerts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update google sync alerts"
  ON public.google_sync_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete google sync alerts"
  ON public.google_sync_alerts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_sync_alerts;
ALTER TABLE public.google_sync_alerts REPLICA IDENTITY FULL;

-- Upsert RPC for dedupe-and-increment from edge functions (service role bypasses RLS,
-- but having an RPC keeps the call atomic and clean).
CREATE OR REPLACE FUNCTION public.raise_google_sync_alert(
  p_category text,
  p_severity text,
  p_title text,
  p_message text,
  p_instructor_id uuid DEFAULT NULL,
  p_lesson_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.google_sync_alerts (
    category, severity, title, message, instructor_id, lesson_id, metadata
  )
  VALUES (p_category, p_severity, p_title, p_message, p_instructor_id, p_lesson_id, p_metadata)
  ON CONFLICT (
    category,
    COALESCE(instructor_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(lesson_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) WHERE resolved_at IS NULL
  DO UPDATE SET
    occurrence_count = public.google_sync_alerts.occurrence_count + 1,
    last_seen_at = now(),
    message = EXCLUDED.message,
    metadata = EXCLUDED.metadata,
    severity = CASE
      WHEN EXCLUDED.severity = 'critical' THEN 'critical'
      WHEN public.google_sync_alerts.severity = 'critical' THEN 'critical'
      WHEN EXCLUDED.severity = 'high' OR public.google_sync_alerts.severity = 'high' THEN 'high'
      ELSE public.google_sync_alerts.severity
    END
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.raise_google_sync_alert(text, text, text, text, uuid, uuid, jsonb) TO authenticated, service_role;