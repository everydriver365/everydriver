
-- Add white-label columns to schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_colour TEXT DEFAULT '#1a365d',
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug);

-- Create a public view for the booking page (no PII)
CREATE OR REPLACE VIEW public.public_schools AS
SELECT id, name, slug, description, logo_url, brand_colour
FROM public.schools
WHERE slug IS NOT NULL;

-- Allow anyone to read public school info (for booking page)
CREATE POLICY "Anyone can view schools with a slug"
  ON public.schools
  FOR SELECT
  USING (slug IS NOT NULL);

-- Allow school owners to update their own school
CREATE POLICY "School owners can update their school"
  ON public.schools
  FOR UPDATE
  USING (owner_user_id = auth.uid());
