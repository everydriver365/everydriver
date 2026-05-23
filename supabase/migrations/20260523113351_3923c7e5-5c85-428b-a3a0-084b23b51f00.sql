ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS insurance_ncb_years integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_company_phone text,
  ADD COLUMN IF NOT EXISTS insurance_claims_line text;