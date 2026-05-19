ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS intensive_hours_paid numeric(6,2),
  ADD COLUMN IF NOT EXISTS intensive_course_payout numeric(10,2);