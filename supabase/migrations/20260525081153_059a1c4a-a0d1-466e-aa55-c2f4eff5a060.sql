ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS parent_email text;
CREATE INDEX IF NOT EXISTS idx_pupils_parent_email_lower ON public.pupils (lower(parent_email));