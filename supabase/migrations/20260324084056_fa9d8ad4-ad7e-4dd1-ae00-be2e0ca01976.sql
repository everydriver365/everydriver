CREATE TABLE public.meta_data_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_user_id TEXT NOT NULL,
  confirmation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_data_deletions ENABLE ROW LEVEL SECURITY;