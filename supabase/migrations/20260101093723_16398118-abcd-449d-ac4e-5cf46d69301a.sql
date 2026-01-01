-- Add new instructor profile fields
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS special_skills text,
ADD COLUMN IF NOT EXISTS extra_info text,
ADD COLUMN IF NOT EXISTS brand_colour text DEFAULT '#1e3a5f',
ADD COLUMN IF NOT EXISTS school_skim_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_advance_days integer DEFAULT 28,
ADD COLUMN IF NOT EXISTS personal_website_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS custom_branding_enabled boolean DEFAULT false;

-- Add comment to hide school_skim from instructor views
COMMENT ON COLUMN public.instructors.school_skim_percentage IS 'Hidden from instructors - extra percentage charged to pupils';