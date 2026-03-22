
-- Create instructor_addons table
CREATE TABLE public.instructor_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  addon_type text NOT NULL,
  status text DEFAULT 'active',
  price_monthly numeric DEFAULT 0,
  gocardless_subscription_id text,
  started_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, addon_type)
);

-- Enable RLS
ALTER TABLE public.instructor_addons ENABLE ROW LEVEL SECURITY;

-- RLS: instructors can read their own add-ons
CREATE POLICY "Instructors can view own addons"
  ON public.instructor_addons
  FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- RLS: instructors can insert their own add-ons
CREATE POLICY "Instructors can insert own addons"
  ON public.instructor_addons
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- RLS: instructors can update their own add-ons
CREATE POLICY "Instructors can update own addons"
  ON public.instructor_addons
  FOR UPDATE
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
