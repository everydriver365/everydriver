-- Add pupil_id to saved_routes for direct pupil association
ALTER TABLE public.saved_routes 
ADD COLUMN IF NOT EXISTS pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL;

-- Create index for efficient pupil route lookups
CREATE INDEX IF NOT EXISTS idx_saved_routes_pupil_id ON public.saved_routes(pupil_id);

-- Update existing saved_routes to get pupil_id from linked lesson_telematics
UPDATE public.saved_routes sr
SET pupil_id = lt.pupil_id
FROM public.lesson_telematics lt
WHERE sr.telematics_id = lt.id AND sr.pupil_id IS NULL;