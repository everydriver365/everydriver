ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS fuel_type text NOT NULL DEFAULT 'petrol',
  ADD COLUMN IF NOT EXISTS battery_kwh numeric,
  ADD COLUMN IF NOT EXISTS electricity_cost_per_kwh numeric DEFAULT 0.30;