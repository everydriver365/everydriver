-- Add school_id column to discount_codes
ALTER TABLE public.discount_codes 
ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_discount_codes_school_id ON public.discount_codes(school_id);

-- RLS policy: school owners can manage their own school's discount codes
CREATE POLICY "School owners can view their discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (
  school_id IS NOT NULL AND public.is_school_owner(school_id)
);

CREATE POLICY "School owners can create discount codes for their school"
ON public.discount_codes
FOR INSERT
TO authenticated
WITH CHECK (
  school_id IS NOT NULL AND public.is_school_owner(school_id)
);

CREATE POLICY "School owners can update their school discount codes"
ON public.discount_codes
FOR UPDATE
TO authenticated
USING (
  school_id IS NOT NULL AND public.is_school_owner(school_id)
);

CREATE POLICY "School owners can delete their school discount codes"
ON public.discount_codes
FOR DELETE
TO authenticated
USING (
  school_id IS NOT NULL AND public.is_school_owner(school_id)
);