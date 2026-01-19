-- Add mileage tracking to scheduled lessons
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS lesson_miles NUMERIC(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dropoff_postcode TEXT DEFAULT NULL;

-- Add Xero integration fields to instructors
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS xero_tenant_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS xero_connected BOOLEAN DEFAULT false;