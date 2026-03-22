
-- Add per-seat pricing columns to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS base_price_monthly numeric DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS per_seat_price_monthly numeric DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS min_seats integer DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_per_seat boolean DEFAULT false;

-- Add seat count to instructor_subscriptions
ALTER TABLE instructor_subscriptions ADD COLUMN IF NOT EXISTS seat_count integer DEFAULT 1;
ALTER TABLE instructor_subscriptions ADD COLUMN IF NOT EXISTS total_monthly_amount numeric;

-- Create multi_school_seats table to track individual instructors under a franchise
CREATE TABLE IF NOT EXISTS multi_school_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES instructor_subscriptions(id) ON DELETE CASCADE NOT NULL,
  franchise_instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,
  seat_instructor_id uuid REFERENCES instructors(id) ON DELETE SET NULL,
  seat_email text,
  seat_name text,
  status text DEFAULT 'invited' NOT NULL,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE multi_school_seats ENABLE ROW LEVEL SECURITY;

-- Franchise owner can manage their own seats
CREATE POLICY "Franchise owners can manage their seats"
  ON multi_school_seats FOR ALL TO authenticated
  USING (franchise_instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (franchise_instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

-- Update Multi-School plan with per-seat pricing
UPDATE subscription_plans 
SET base_price_monthly = 49, 
    per_seat_price_monthly = 9.99, 
    min_seats = 3,
    is_per_seat = true,
    price_monthly = 49
WHERE slug = 'multi_school';
