-- Soft-park all network placeholder instructors so they disappear
-- from every public surface in one shot (all public queries filter is_active=true).
UPDATE public.instructors
SET is_active = false
WHERE is_network_placeholder = true
  AND is_active = true;

-- Speed up public postcode/area searches now that we always exclude placeholders.
CREATE INDEX IF NOT EXISTS idx_instructors_public_postcode
  ON public.instructors (home_postcode)
  WHERE is_active = true AND is_network_placeholder = false;
