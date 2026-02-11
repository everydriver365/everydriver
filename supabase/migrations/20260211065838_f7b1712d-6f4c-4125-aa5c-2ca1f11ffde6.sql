ALTER TABLE public.instructors 
  ADD COLUMN IF NOT EXISTS klarna_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clearpay_enabled boolean DEFAULT false;