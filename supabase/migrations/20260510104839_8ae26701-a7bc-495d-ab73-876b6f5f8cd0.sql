
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS mot_certificate_url text,
  ADD COLUMN IF NOT EXISTS road_tax_reference text,
  ADD COLUMN IF NOT EXISTS driving_licence_front_url text,
  ADD COLUMN IF NOT EXISTS driving_licence_back_url text;
