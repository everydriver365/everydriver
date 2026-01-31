-- Add cached coordinates to instructors table for weather/traffic lookups
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS lat numeric,
ADD COLUMN IF NOT EXISTS lng numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.instructors.lat IS 'Cached latitude from home_postcode for weather/traffic alerts';
COMMENT ON COLUMN public.instructors.lng IS 'Cached longitude from home_postcode for weather/traffic alerts';