-- Create service type enum (if not exists, ignore error)
DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM (
    'oil_change', 'full_service', 'mot', 'tire_rotation', 
    'brake_check', 'air_filter', 'coolant_flush', 'transmission', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Vehicle service reminders configuration
CREATE TABLE IF NOT EXISTS public.vehicle_service_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.instructor_vehicles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  custom_name TEXT,
  interval_km INTEGER,
  interval_months INTEGER,
  reminder_days_before INTEGER DEFAULT 14,
  last_service_date DATE,
  last_service_km INTEGER,
  next_due_date DATE,
  next_due_km INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle service history log
CREATE TABLE IF NOT EXISTS public.vehicle_service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.instructor_vehicles(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.vehicle_service_reminders(id) ON DELETE SET NULL,
  service_type service_type NOT NULL,
  custom_name TEXT,
  service_date DATE NOT NULL,
  odometer_km INTEGER,
  cost_gbp DECIMAL(10,2),
  provider TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_service_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders
CREATE POLICY "Instructors can view own reminders"
ON public.vehicle_service_reminders FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own reminders"
ON public.vehicle_service_reminders FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own reminders"
ON public.vehicle_service_reminders FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete own reminders"
ON public.vehicle_service_reminders FOR DELETE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS Policies for history
CREATE POLICY "Instructors can view own service history"
ON public.vehicle_service_history FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own service history"
ON public.vehicle_service_history FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own service history"
ON public.vehicle_service_history FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete own service history"
ON public.vehicle_service_history FOR DELETE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_reminders_instructor ON public.vehicle_service_reminders(instructor_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_vehicle ON public.vehicle_service_reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_next_due ON public.vehicle_service_reminders(next_due_date);
CREATE INDEX IF NOT EXISTS idx_service_history_instructor ON public.vehicle_service_history(instructor_id);
CREATE INDEX IF NOT EXISTS idx_service_history_vehicle ON public.vehicle_service_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_history_date ON public.vehicle_service_history(service_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_service_reminders_updated_at ON public.vehicle_service_reminders;
CREATE TRIGGER update_service_reminders_updated_at
BEFORE UPDATE ON public.vehicle_service_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();