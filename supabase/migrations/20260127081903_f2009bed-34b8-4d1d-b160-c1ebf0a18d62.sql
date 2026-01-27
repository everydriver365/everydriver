-- Add status field to pupils table for tracking pupil lifecycle
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.pupils 
ADD CONSTRAINT pupils_status_check 
CHECK (status IN ('active', 'passed', 'inactive', 'on_hold', 'cancelled'));

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_pupils_status ON public.pupils(status);

-- Update existing pupils based on test_passed field
UPDATE public.pupils 
SET status = 'passed' 
WHERE test_passed = true AND status = 'active';