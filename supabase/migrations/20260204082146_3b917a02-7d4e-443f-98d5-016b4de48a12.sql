-- Add pupil_id column to favourite_locations for linking pupil homes to specific pupils
ALTER TABLE public.favourite_locations
ADD COLUMN pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_favourite_locations_pupil_id ON public.favourite_locations(pupil_id);