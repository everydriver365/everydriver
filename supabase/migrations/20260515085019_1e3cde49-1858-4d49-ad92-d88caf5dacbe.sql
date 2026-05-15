
-- Match requests table
CREATE TABLE public.test_swap_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_signup_id UUID NOT NULL REFERENCES public.public_test_swap_signups(id) ON DELETE CASCADE,
  target_signup_id UUID NOT NULL REFERENCES public.public_test_swap_signups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_signup_id, target_signup_id)
);

CREATE INDEX idx_tsmr_requester ON public.test_swap_match_requests(requester_signup_id);
CREATE INDEX idx_tsmr_target ON public.test_swap_match_requests(target_signup_id);

ALTER TABLE public.test_swap_match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage swap requests"
  ON public.test_swap_match_requests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tsmr_updated_at
  BEFORE UPDATE ON public.test_swap_match_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- List compatible matches for a given signup id (capability token)
CREATE OR REPLACE FUNCTION public.get_test_swap_matches(p_signup_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  current_centre_name TEXT,
  current_test_date DATE,
  current_test_time TIME,
  earliest_new_date DATE,
  latest_new_date DATE,
  has_test_booked BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  already_requested BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.public_test_swap_signups%ROWTYPE;
BEGIN
  SELECT * INTO me FROM public.public_test_swap_signups WHERE id = p_signup_id;
  IF me.id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    split_part(trim(s.full_name), ' ', 1) AS first_name,
    s.current_centre_name,
    s.current_test_date,
    s.current_test_time,
    s.earliest_new_date,
    s.latest_new_date,
    s.has_test_booked,
    s.notes,
    s.created_at,
    EXISTS (
      SELECT 1 FROM public.test_swap_match_requests r
      WHERE r.requester_signup_id = me.id AND r.target_signup_id = s.id
    ) AS already_requested
  FROM public.public_test_swap_signups s
  WHERE s.id <> me.id
    AND s.status = 'pending'
    AND s.has_test_booked = true
    AND lower(s.email) <> lower(me.email)
    AND s.current_test_date IS NOT NULL
    -- Their test date must fit within my window
    AND s.current_test_date BETWEEN me.earliest_new_date AND me.latest_new_date
    -- If I have a test booked, my date must fit within their window too
    AND (
      me.has_test_booked = false
      OR me.current_test_date IS NULL
      OR me.current_test_date BETWEEN s.earliest_new_date AND s.latest_new_date
    )
  ORDER BY s.current_test_date ASC, s.created_at DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_test_swap_matches(UUID) TO anon, authenticated;

-- Create a swap request (validates compatibility server-side)
CREATE OR REPLACE FUNCTION public.request_test_swap(
  p_requester_signup_id UUID,
  p_target_signup_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me public.public_test_swap_signups%ROWTYPE;
  them public.public_test_swap_signups%ROWTYPE;
  v_id UUID;
BEGIN
  IF p_requester_signup_id = p_target_signup_id THEN
    RAISE EXCEPTION 'Cannot request swap with yourself';
  END IF;

  SELECT * INTO me FROM public.public_test_swap_signups WHERE id = p_requester_signup_id;
  SELECT * INTO them FROM public.public_test_swap_signups WHERE id = p_target_signup_id;

  IF me.id IS NULL OR them.id IS NULL THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;

  IF them.status <> 'pending' OR them.has_test_booked = false OR them.current_test_date IS NULL THEN
    RAISE EXCEPTION 'Target swap is not available';
  END IF;

  IF NOT (them.current_test_date BETWEEN me.earliest_new_date AND me.latest_new_date) THEN
    RAISE EXCEPTION 'Their test date does not fit your window';
  END IF;

  IF me.has_test_booked = true AND me.current_test_date IS NOT NULL THEN
    IF NOT (me.current_test_date BETWEEN them.earliest_new_date AND them.latest_new_date) THEN
      RAISE EXCEPTION 'Your test date does not fit their window';
    END IF;
  END IF;

  INSERT INTO public.test_swap_match_requests (requester_signup_id, target_signup_id)
  VALUES (p_requester_signup_id, p_target_signup_id)
  ON CONFLICT (requester_signup_id, target_signup_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_test_swap(UUID, UUID) TO anon, authenticated;
