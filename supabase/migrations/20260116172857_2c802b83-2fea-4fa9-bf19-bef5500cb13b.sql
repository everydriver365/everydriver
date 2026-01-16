-- Add website theme customization columns to instructors table
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS website_theme text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS website_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS website_header_style text DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS website_button_color text,
ADD COLUMN IF NOT EXISTS website_footer_bg text DEFAULT '#111827';

-- Add comment for clarity
COMMENT ON COLUMN public.instructors.website_theme IS 'Preset theme: modern, classic, bold, minimal, elegant';
COMMENT ON COLUMN public.instructors.website_font IS 'Font family: Inter, Poppins, Playfair, Montserrat, Roboto';
COMMENT ON COLUMN public.instructors.website_header_style IS 'Header style: solid, transparent, gradient';