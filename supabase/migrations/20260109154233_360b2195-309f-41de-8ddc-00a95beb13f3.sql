-- Add bonus_earned column to instructors table
ALTER TABLE public.instructors 
ADD COLUMN bonus_earned numeric DEFAULT 0;