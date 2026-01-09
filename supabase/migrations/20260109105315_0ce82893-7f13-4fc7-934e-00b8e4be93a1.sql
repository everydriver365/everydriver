-- Add requested hours to course enquiries
ALTER TABLE public.course_enquiries
ADD COLUMN requested_hours INTEGER DEFAULT 10;