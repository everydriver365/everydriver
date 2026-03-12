CREATE TABLE IF NOT EXISTS public.radius_session_cache (
  id TEXT PRIMARY KEY DEFAULT 'default',
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.radius_session_cache ENABLE ROW LEVEL SECURITY;