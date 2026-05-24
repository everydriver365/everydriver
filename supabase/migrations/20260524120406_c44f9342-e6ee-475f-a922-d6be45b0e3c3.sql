
-- Fix 1: enforce admin-only writes to clash_overridden
CREATE OR REPLACE FUNCTION public.enforce_clash_override_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was boolean := false;
  v_is boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_is := COALESCE(NEW.clash_overridden, false);
  ELSE
    v_was := COALESCE(OLD.clash_overridden, false);
    v_is  := COALESCE(NEW.clash_overridden, false);
  END IF;

  -- Only guard transitions to TRUE (clearing is always allowed).
  IF v_is = true AND (TG_OP = 'INSERT' OR v_was = false) THEN
    IF auth.uid() IS NOT NULL
       AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only admins can set clash_overridden = true'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_clash_override_admin_only ON public.scheduled_lessons;
CREATE TRIGGER trg_enforce_clash_override_admin_only
BEFORE INSERT OR UPDATE OF clash_overridden ON public.scheduled_lessons
FOR EACH ROW EXECUTE FUNCTION public.enforce_clash_override_admin_only();

-- Fix 1: admin-visible duplicate active lessons view (security_invoker so it
-- honours the caller's RLS; admin UI will gate access at the page level).
CREATE OR REPLACE VIEW public.v_duplicate_active_lessons
WITH (security_invoker = true) AS
SELECT
  instructor_id,
  pupil_id,
  lesson_date,
  start_time,
  count(*)            AS duplicate_count,
  array_agg(id ORDER BY created_at) AS lesson_ids,
  min(created_at)     AS first_created_at,
  max(created_at)     AS last_created_at
FROM public.scheduled_lessons
WHERE deleted_at IS NULL
  AND status NOT IN ('cancelled', 'completed')
GROUP BY instructor_id, pupil_id, lesson_date, start_time
HAVING count(*) > 1;

-- Fix 4: Square webhook idempotency
CREATE TABLE IF NOT EXISTS public.processed_square_events (
  event_id    text PRIMARY KEY,
  event_type  text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_square_events ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only (bypasses RLS).

CREATE INDEX IF NOT EXISTS idx_processed_square_events_processed_at
  ON public.processed_square_events (processed_at DESC);

-- Fix 8: per-lesson dedupe column for the daily calendar-sync failure alert
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS calendar_sync_alerted_at timestamptz;
