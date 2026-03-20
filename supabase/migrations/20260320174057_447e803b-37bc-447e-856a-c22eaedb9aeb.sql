
-- Add engine hours tracking to service reminders
ALTER TABLE public.vehicle_service_reminders 
  ADD COLUMN IF NOT EXISTS interval_engine_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS last_service_engine_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS next_due_engine_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;

-- Index for engine hours lookups
CREATE INDEX IF NOT EXISTS idx_service_reminders_next_due_engine_hours 
  ON public.vehicle_service_reminders(next_due_engine_hours) 
  WHERE next_due_engine_hours IS NOT NULL;
