
-- Create test_requests table
CREATE TABLE public.test_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  created_by_type text NOT NULL DEFAULT 'instructor',
  request_type text NOT NULL DEFAULT 'have_test',
  test_centre_id uuid REFERENCES public.test_centres(id),
  test_centre_name text,
  test_date date NOT NULL,
  test_time time NOT NULL,
  date_range_end date,
  time_range_end time,
  willing_to_pay_swap_fee boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create test_swap_offers table
CREATE TABLE public.test_swap_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_request_id uuid NOT NULL REFERENCES public.test_requests(id) ON DELETE CASCADE,
  offered_by_instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  offered_by_admin boolean NOT NULL DEFAULT false,
  offered_test_date date NOT NULL,
  offered_test_time time NOT NULL,
  offered_test_centre_id uuid REFERENCES public.test_centres(id),
  offered_test_centre_name text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_swap_offers ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for test_requests
CREATE TRIGGER set_test_requests_updated_at
  BEFORE UPDATE ON public.test_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS for test_requests
-- Instructors can read their own rows
CREATE POLICY "Instructors read own test_requests"
  ON public.test_requests FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Instructors can insert for themselves
CREATE POLICY "Instructors insert own test_requests"
  ON public.test_requests FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Instructors can update own
CREATE POLICY "Instructors update own test_requests"
  ON public.test_requests FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Instructors can delete own
CREATE POLICY "Instructors delete own test_requests"
  ON public.test_requests FOR DELETE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Admins can do everything on test_requests
CREATE POLICY "Admins full access test_requests"
  ON public.test_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Swap board: instructors can read all active requests (to see swap opportunities)
CREATE POLICY "Instructors read all active test_requests"
  ON public.test_requests FOR SELECT TO authenticated
  USING (status = 'active' AND public.get_instructor_id_for_user(auth.uid()) IS NOT NULL);

-- RLS for test_swap_offers
-- Instructors can read offers on their requests or offers they made
CREATE POLICY "Instructors read own test_swap_offers"
  ON public.test_swap_offers FOR SELECT TO authenticated
  USING (
    offered_by_instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.test_requests tr
      WHERE tr.id = test_request_id
        AND tr.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Instructors can insert offers
CREATE POLICY "Instructors insert test_swap_offers"
  ON public.test_swap_offers FOR INSERT TO authenticated
  WITH CHECK (offered_by_instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Instructors can update offers they made
CREATE POLICY "Instructors update own test_swap_offers"
  ON public.test_swap_offers FOR UPDATE TO authenticated
  USING (
    offered_by_instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.test_requests tr
      WHERE tr.id = test_request_id
        AND tr.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Admins full access on offers
CREATE POLICY "Admins full access test_swap_offers"
  ON public.test_swap_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
