-- Add separate header/nav bar color column
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS website_header_bg TEXT;