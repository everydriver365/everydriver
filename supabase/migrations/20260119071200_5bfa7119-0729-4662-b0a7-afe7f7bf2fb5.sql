-- Add tax and vehicle cost tracking fields to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS tax_code TEXT DEFAULT '1257L',
ADD COLUMN IF NOT EXISTS vehicle_mpg NUMERIC(5,1) DEFAULT 40.0,
ADD COLUMN IF NOT EXISTS fuel_cost_per_litre NUMERIC(5,3) DEFAULT 1.45;