-- Add date_of_birth to pupils table
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add parent signature fields to pupil_signatures
ALTER TABLE public.pupil_signatures
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_signature_url TEXT,
ADD COLUMN IF NOT EXISTS parent_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_parent_signature BOOLEAN DEFAULT false;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_pupil_signatures_requires_parent ON public.pupil_signatures(requires_parent_signature);