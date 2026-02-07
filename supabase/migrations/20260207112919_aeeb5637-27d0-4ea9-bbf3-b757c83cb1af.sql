
-- Add driver_number and theory_number columns to pupils table
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS driver_number text;
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS theory_cert_number text;
