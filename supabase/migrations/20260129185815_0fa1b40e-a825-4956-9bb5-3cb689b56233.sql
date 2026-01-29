-- Add image_url and detailed_content columns to instructor_app_features
ALTER TABLE public.instructor_app_features 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS detailed_content TEXT;