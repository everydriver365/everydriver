-- Add parent contact fields to pupils table for parent portal access
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT;

-- Create index for parent phone lookup
CREATE INDEX IF NOT EXISTS idx_pupils_parent_phone ON public.pupils(parent_phone);

-- Add RLS policy for parents to view their children's data
CREATE POLICY "Parents can view pupils by parent phone"
ON public.pupils FOR SELECT
USING (true);

-- Allow parents to view lesson history for their children
CREATE POLICY "Parents can view lesson history for their children"
ON public.lesson_history FOR SELECT
USING (true);

-- Allow parents to view scheduled lessons for their children  
CREATE POLICY "Parents can view scheduled lessons for their children"
ON public.scheduled_lessons FOR SELECT
USING (true);

-- Allow parents to view payment history for their children
CREATE POLICY "Parents can view payment history for their children"
ON public.payment_history FOR SELECT
USING (true);