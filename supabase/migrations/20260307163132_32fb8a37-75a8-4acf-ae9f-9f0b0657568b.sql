CREATE TABLE IF NOT EXISTS public.geotab_session_cache (
  id TEXT PRIMARY KEY DEFAULT 'default',
  session_id TEXT NOT NULL,
  server_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geotab_session_cache ENABLE ROW LEVEL SECURITY;