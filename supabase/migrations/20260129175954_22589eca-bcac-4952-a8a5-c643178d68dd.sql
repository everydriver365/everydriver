-- Add theory test tracking columns to pupils table
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS theory_test_date date,
ADD COLUMN IF NOT EXISTS theory_test_passed boolean;