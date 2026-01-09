-- Add new column for school skim as GBP amount
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS school_skim_amount numeric DEFAULT 0;

-- Copy existing percentage values as placeholder (admin will need to update actual amounts)
-- Note: We keep the old column for backward compatibility during transition
UPDATE public.instructors 
SET school_skim_amount = 0 
WHERE school_skim_amount IS NULL;

-- Add comment to clarify the new column
COMMENT ON COLUMN public.instructors.school_skim_amount IS 'Hidden from instructors - fixed GBP amount deducted per course booking';