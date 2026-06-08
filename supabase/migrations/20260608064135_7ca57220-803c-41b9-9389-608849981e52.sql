
CREATE TABLE public.instructor_ics_poll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.instructor_ics_subscriptions(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL,
  polled_at timestamptz NOT NULL DEFAULT now(),
  duration_ms integer,
  http_status integer,
  status text NOT NULL,
  error text,
  bytes_fetched integer,
  events_parsed integer NOT NULL DEFAULT 0,
  events_inserted integer NOT NULL DEFAULT 0,
  events_updated integer NOT NULL DEFAULT 0,
  events_deleted integer NOT NULL DEFAULT 0,
  events_skipped integer NOT NULL DEFAULT 0,
  inserted_uids jsonb NOT NULL DEFAULT '[]'::jsonb,
  skipped_uids jsonb NOT NULL DEFAULT '[]'::jsonb,
  parse_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ics_poll_runs_sub ON public.instructor_ics_poll_runs(subscription_id, polled_at DESC);
CREATE INDEX idx_ics_poll_runs_instructor ON public.instructor_ics_poll_runs(instructor_id, polled_at DESC);

GRANT SELECT ON public.instructor_ics_poll_runs TO authenticated;
GRANT ALL ON public.instructor_ics_poll_runs TO service_role;

ALTER TABLE public.instructor_ics_poll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own ICS poll runs"
ON public.instructor_ics_poll_runs
FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Auto-prune: keep only most recent 50 runs per subscription
CREATE OR REPLACE FUNCTION public.prune_ics_poll_runs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.instructor_ics_poll_runs
  WHERE subscription_id = NEW.subscription_id
    AND id NOT IN (
      SELECT id FROM public.instructor_ics_poll_runs
      WHERE subscription_id = NEW.subscription_id
      ORDER BY polled_at DESC
      LIMIT 50
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prune_ics_poll_runs
AFTER INSERT ON public.instructor_ics_poll_runs
FOR EACH ROW EXECUTE FUNCTION public.prune_ics_poll_runs();
