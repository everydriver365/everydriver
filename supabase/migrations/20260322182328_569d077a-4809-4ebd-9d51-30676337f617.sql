
-- Create instructor_referrals table
CREATE TABLE public.instructor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  referred_email text NOT NULL,
  referred_instructor_id uuid REFERENCES public.instructors(id),
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 10.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz
);

ALTER TABLE public.instructor_referrals ENABLE ROW LEVEL SECURITY;

-- RLS: instructors can see their own referrals
CREATE POLICY "Instructors can view own referrals"
  ON public.instructor_referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert referrals"
  ON public.instructor_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Add whatsapp_enabled to instructors
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false;
