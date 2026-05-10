ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS adi_grade text,
  ADD COLUMN IF NOT EXISTS dbs_certificate_issued date,
  ADD COLUMN IF NOT EXISTS dbs_certificate_url text,
  ADD COLUMN IF NOT EXISTS driving_licence_number text,
  ADD COLUMN IF NOT EXISTS driving_licence_expiry date,
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS insurance_certificate_url text,
  ADD COLUMN IF NOT EXISTS years_experience_adi integer,
  ADD COLUMN IF NOT EXISTS additional_certifications text[] DEFAULT '{}'::text[];

ALTER TABLE public.instructors
  DROP CONSTRAINT IF EXISTS instructors_adi_grade_check;
ALTER TABLE public.instructors
  ADD CONSTRAINT instructors_adi_grade_check CHECK (adi_grade IS NULL OR adi_grade IN ('A','B'));