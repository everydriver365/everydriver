
-- Add password_hash column to pupils for email/password login
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS password_hash TEXT;
