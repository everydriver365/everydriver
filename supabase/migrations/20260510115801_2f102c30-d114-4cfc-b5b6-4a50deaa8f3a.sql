ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS weekend_surcharge_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_holiday_surcharge_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS odd_hours_surcharge_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS odd_hours_start time NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS odd_hours_end time NOT NULL DEFAULT '07:00';