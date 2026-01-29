-- Add color column to instructor_manual_blocks for custom block colors
ALTER TABLE public.instructor_manual_blocks 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';