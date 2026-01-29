-- Add height_cm column to instructor_health_settings for BMI calculation
ALTER TABLE public.instructor_health_settings
ADD COLUMN height_cm numeric DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.instructor_health_settings.height_cm IS 'Height in centimeters for BMI calculation';