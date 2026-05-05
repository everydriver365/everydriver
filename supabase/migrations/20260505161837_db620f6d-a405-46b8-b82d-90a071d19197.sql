
ALTER TABLE public.availability_rules
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false;

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS min_lead_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS slot_increment_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS allow_same_day_booking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_block_bank_holidays boolean NOT NULL DEFAULT true;
