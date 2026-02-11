
-- ============================================================
-- Step 1: Create quartix_auth_cache table for token caching
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quartix_auth_cache (
  id text PRIMARY KEY DEFAULT 'default',
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quartix_auth_cache ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no user access needed)
-- No RLS policies = only service role key can read/write

-- ============================================================
-- Step 2: Create cron_sync_config table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cron_sync_config (
  id text PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT true,
  interval_seconds integer NOT NULL DEFAULT 15,
  last_run_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_sync_config ENABLE ROW LEVEL SECURITY;

-- Insert default config
INSERT INTO public.cron_sync_config (id, is_enabled, interval_seconds)
VALUES ('quartix-position-sync', true, 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cron_sync_config (id, is_enabled, interval_seconds)
VALUES ('quartix-deferred-enrichment', true, 60)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Auto-cleanup function for stale sessions
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- End sessions that have been idle for more than 30 minutes
  -- (no GPS point recorded in the last 30 minutes)
  UPDATE public.lesson_telematics lt
  SET ended_at = now()
  WHERE lt.ended_at IS NULL
    AND lt.started_at < now() - interval '30 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.telematics_gps_points gp
      WHERE gp.telematics_id = lt.id
        AND gp.recorded_at > now() - interval '30 minutes'
    );

  -- Clear device session references for ended sessions
  UPDATE public.gps_devices gd
  SET current_session_id = NULL,
      current_pupil_id = NULL
  WHERE gd.current_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.lesson_telematics lt
      WHERE lt.id = gd.current_session_id
        AND lt.ended_at IS NOT NULL
    );
END;
$$;

-- ============================================================
-- Step 4: Enable pg_net extension (needed for cron HTTP calls)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
