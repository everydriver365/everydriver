-- Add photo_url column to homepage_testimonials table for direct pupil photos
ALTER TABLE public.homepage_testimonials
ADD COLUMN photo_url TEXT;