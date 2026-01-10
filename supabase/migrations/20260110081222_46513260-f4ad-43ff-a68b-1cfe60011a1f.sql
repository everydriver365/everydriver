-- Add branding fields for the instructor's pupil app
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS pupil_app_dark_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pupil_app_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS secondary_colour text DEFAULT '#d4a574';

-- Create a unique slug for each instructor's pupil app URL
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS app_slug text UNIQUE;

-- Set default slugs for existing instructors based on their name
UPDATE public.instructors 
SET app_slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE app_slug IS NULL;