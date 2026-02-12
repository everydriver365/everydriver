
-- Create instructor_bank_details table for TrueLayer payouts
CREATE TABLE public.instructor_bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  sort_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_bank_details ENABLE ROW LEVEL SECURITY;

-- Only the instructor who owns these details can view them
CREATE POLICY "Instructors can view own bank details"
ON public.instructor_bank_details FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Only the instructor can insert their own bank details
CREATE POLICY "Instructors can insert own bank details"
ON public.instructor_bank_details FOR INSERT
TO authenticated
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Only the instructor can update their own bank details
CREATE POLICY "Instructors can update own bank details"
ON public.instructor_bank_details FOR UPDATE
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Only the instructor can delete their own bank details
CREATE POLICY "Instructors can delete own bank details"
ON public.instructor_bank_details FOR DELETE
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_instructor_bank_details_updated_at
BEFORE UPDATE ON public.instructor_bank_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add truelayer_enabled to instructors table
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS truelayer_enabled BOOLEAN DEFAULT false;
