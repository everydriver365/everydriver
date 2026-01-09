-- Create payment history table
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'manual',
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Payment history is viewable by instructors"
ON public.payment_history
FOR SELECT
USING (true);

CREATE POLICY "Instructors can insert payment history"
ON public.payment_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Instructors can delete payment history"
ON public.payment_history
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_payment_history_instructor ON public.payment_history(instructor_id);
CREATE INDEX idx_payment_history_pupil ON public.payment_history(pupil_id);
CREATE INDEX idx_payment_history_recorded_at ON public.payment_history(recorded_at DESC);