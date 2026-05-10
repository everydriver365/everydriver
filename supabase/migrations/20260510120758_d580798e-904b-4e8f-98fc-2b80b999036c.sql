ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS price_per_hour numeric,
  ADD COLUMN IF NOT EXISTS surcharge_amount numeric NOT NULL DEFAULT 0;