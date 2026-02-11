
-- Add payout tracking columns to payment_history
ALTER TABLE public.payment_history 
  ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_id uuid,
  ADD COLUMN IF NOT EXISTS transferred_at timestamptz;

-- Create instructor payouts table
CREATE TABLE IF NOT EXISTS public.instructor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id),
  amount numeric NOT NULL,
  payment_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  transferred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_payouts ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage payouts"
  ON public.instructor_payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Instructors can view their own payouts
CREATE POLICY "Instructors can view own payouts"
  ON public.instructor_payouts FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_payouts;

-- Indexes
CREATE INDEX idx_payment_history_payout_status ON public.payment_history(payout_status);
CREATE INDEX idx_instructor_payouts_instructor ON public.instructor_payouts(instructor_id);
