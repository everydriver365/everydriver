
-- Create payment_reminder_log table
CREATE TABLE public.payment_reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'outstanding_balance',
  channel TEXT NOT NULL, -- 'sms', 'email', 'push'
  amount_owed NUMERIC,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminder_log ENABLE ROW LEVEL SECURITY;

-- Instructors can read their own reminder logs
CREATE POLICY "Instructors can view their own reminder logs"
ON public.payment_reminder_log
FOR SELECT
TO authenticated
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Admin can view all reminder logs
CREATE POLICY "Admins can view all reminder logs"
ON public.payment_reminder_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (edge functions use service role key)
CREATE POLICY "Service can insert reminder logs"
ON public.payment_reminder_log
FOR INSERT
WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_payment_reminder_log_pupil ON public.payment_reminder_log(pupil_id, sent_at DESC);
CREATE INDEX idx_payment_reminder_log_instructor ON public.payment_reminder_log(instructor_id, sent_at DESC);
