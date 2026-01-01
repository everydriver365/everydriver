-- Add course image column to instructor_courses table
ALTER TABLE public.instructor_courses
ADD COLUMN IF NOT EXISTS course_image_url text;