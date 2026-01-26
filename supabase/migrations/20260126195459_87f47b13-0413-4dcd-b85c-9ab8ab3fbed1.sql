-- Add text color customization columns to instructors table
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS website_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_heading_color text DEFAULT '#ffffff';

-- Add comments for clarity
COMMENT ON COLUMN public.instructors.website_text_color IS 'Primary text color for mini-website body content';
COMMENT ON COLUMN public.instructors.website_heading_color IS 'Heading/title text color for mini-website';