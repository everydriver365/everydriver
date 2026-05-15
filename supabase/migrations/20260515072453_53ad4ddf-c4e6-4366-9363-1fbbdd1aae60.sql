-- Create table to persist DVSA swap checklist progress per pupil
CREATE TABLE public.pupil_swap_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL UNIQUE REFERENCES public.pupils(id) ON DELETE CASCADE,
  completed_steps JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pupil_swap_checklist ENABLE ROW LEVEL SECURITY;

-- Pupils can read their own checklist progress
CREATE POLICY "Pupils can view their own checklist"
ON public.pupil_swap_checklist
FOR SELECT
TO authenticated
USING (pupil_id = auth.uid());

-- Pupils can update their own checklist progress
CREATE POLICY "Pupils can update their own checklist"
ON public.pupil_swap_checklist
FOR UPDATE
TO authenticated
USING (pupil_id = auth.uid());

-- Pupils can insert their own checklist progress
CREATE POLICY "Pupils can insert their own checklist"
ON public.pupil_swap_checklist
FOR INSERT
TO authenticated
WITH CHECK (pupil_id = auth.uid());

-- Pupils can delete their own checklist progress
CREATE POLICY "Pupils can delete their own checklist"
ON public.pupil_swap_checklist
FOR DELETE
TO authenticated
USING (pupil_id = auth.uid());

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pupil_swap_checklist_updated_at
BEFORE UPDATE ON public.pupil_swap_checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
