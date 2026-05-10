ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS weekend_surcharge_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_holiday_surcharge_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS odd_hours_surcharge_amount numeric NOT NULL DEFAULT 0;

-- Migrate any existing percentage values into a sensible default amount (interpret pct of typical £40 rate)
UPDATE public.instructors
SET weekend_surcharge_amount = ROUND((COALESCE(weekend_surcharge_pct,0)::numeric / 100) * COALESCE(hourly_rate, 40), 2)
WHERE weekend_surcharge_amount = 0 AND COALESCE(weekend_surcharge_pct,0) > 0;
UPDATE public.instructors
SET bank_holiday_surcharge_amount = ROUND((COALESCE(bank_holiday_surcharge_pct,0)::numeric / 100) * COALESCE(hourly_rate, 40), 2)
WHERE bank_holiday_surcharge_amount = 0 AND COALESCE(bank_holiday_surcharge_pct,0) > 0;
UPDATE public.instructors
SET odd_hours_surcharge_amount = ROUND((COALESCE(odd_hours_surcharge_pct,0)::numeric / 100) * COALESCE(hourly_rate, 40), 2)
WHERE odd_hours_surcharge_amount = 0 AND COALESCE(odd_hours_surcharge_pct,0) > 0;

ALTER TABLE public.instructors
  DROP COLUMN IF EXISTS weekend_surcharge_pct,
  DROP COLUMN IF EXISTS bank_holiday_surcharge_pct,
  DROP COLUMN IF EXISTS odd_hours_surcharge_pct;