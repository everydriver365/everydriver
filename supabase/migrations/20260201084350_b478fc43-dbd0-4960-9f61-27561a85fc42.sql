-- Add location_name column to instructors table for caching geocoded area name
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS location_name TEXT;