-- Add adi_certificate_url column for instructor certificate uploads
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS adi_certificate_url TEXT;

-- Add profile_image_url column to pupils table for pupil profile photos
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS profile_image_url TEXT;