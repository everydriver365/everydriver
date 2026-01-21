-- Multi-Vehicle Fleet Support
-- Vehicles table to support multiple vehicles per instructor
CREATE TABLE public.instructor_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  is_primary BOOLEAN DEFAULT false,
  current_odometer_km INTEGER DEFAULT 0,
  insurance_expiry DATE,
  mot_expiry DATE,
  tax_expiry DATE,
  last_service_date DATE,
  next_service_due_km INTEGER,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add vehicle_id to scheduled_lessons (optional link)
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL;

-- Add vehicle_id to lesson_history (optional link)
ALTER TABLE public.lesson_history 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL;

-- Add vehicle_id to mileage_log (optional link)
ALTER TABLE public.mileage_log 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.instructor_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructor_vehicles
CREATE POLICY "Instructors can view their vehicles"
ON public.instructor_vehicles FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can manage their vehicles"
ON public.instructor_vehicles FOR ALL
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Service role full access to vehicles"
ON public.instructor_vehicles FOR ALL
USING (true);

-- Create indexes
CREATE INDEX idx_instructor_vehicles_instructor ON public.instructor_vehicles(instructor_id);
CREATE INDEX idx_instructor_vehicles_primary ON public.instructor_vehicles(instructor_id, is_primary) WHERE is_primary = true;

-- Trigger for updated_at
CREATE TRIGGER update_instructor_vehicles_updated_at
BEFORE UPDATE ON public.instructor_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();