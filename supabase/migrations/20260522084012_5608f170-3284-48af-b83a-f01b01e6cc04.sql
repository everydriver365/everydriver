
-- 1. Make pupil_id nullable on slot_offers (broadcast offers have no single recipient until claimed)
ALTER TABLE public.slot_offers ALTER COLUMN pupil_id DROP NOT NULL;

-- 2. Add status column for offer-level state
ALTER TABLE public.slot_offers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE public.slot_offers
  DROP CONSTRAINT IF EXISTS slot_offers_status_check;
ALTER TABLE public.slot_offers
  ADD CONSTRAINT slot_offers_status_check
  CHECK (status IN ('open','filled','expired','cancelled'));

CREATE INDEX IF NOT EXISTS idx_slot_offers_status_expires
  ON public.slot_offers(status, expires_at)
  WHERE status = 'open';

-- 3. Recipients table (fan-out)
CREATE TABLE IF NOT EXISTS public.slot_offer_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_offer_id uuid NOT NULL REFERENCES public.slot_offers(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  notified_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  claimed_at timestamptz,
  declined_at timestamptz,
  distance_miles numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_offer_id, pupil_id)
);

CREATE INDEX IF NOT EXISTS idx_slot_recipients_pupil
  ON public.slot_offer_recipients(pupil_id) WHERE claimed_at IS NULL AND declined_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_slot_recipients_offer
  ON public.slot_offer_recipients(slot_offer_id);

ALTER TABLE public.slot_offer_recipients ENABLE ROW LEVEL SECURITY;

-- 4. RLS for recipients
DROP POLICY IF EXISTS "slot_recipients instructor full" ON public.slot_offer_recipients;
CREATE POLICY "slot_recipients instructor full"
  ON public.slot_offer_recipients
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "slot_recipients pupil read" ON public.slot_offer_recipients;
CREATE POLICY "slot_recipients pupil read"
  ON public.slot_offer_recipients
  FOR SELECT TO authenticated
  USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "slot_recipients pupil viewed update" ON public.slot_offer_recipients;
CREATE POLICY "slot_recipients pupil viewed update"
  ON public.slot_offer_recipients
  FOR UPDATE TO authenticated
  USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()))
  WITH CHECK (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

-- 5. Pupil SELECT policy on slot_offers (so they can read the offers they're invited to)
DROP POLICY IF EXISTS "Pupils can view offers they are invited to" ON public.slot_offers;
CREATE POLICY "Pupils can view offers they are invited to"
  ON public.slot_offers
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT slot_offer_id FROM public.slot_offer_recipients
      WHERE pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
    )
  );

-- 6. Realtime publication
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_offer_recipients';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

ALTER TABLE public.slot_offer_recipients REPLICA IDENTITY FULL;

-- 7. Atomic claim RPC — first-write-wins
CREATE OR REPLACE FUNCTION public.claim_slot_offer(p_offer_id uuid, p_pupil_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.slot_offers%ROWTYPE;
  v_recipient public.slot_offer_recipients%ROWTYPE;
  v_caller_pupil uuid;
  v_lesson_id uuid;
  v_pupil_pickup record;
BEGIN
  -- Verify caller owns this pupil
  SELECT id INTO v_caller_pupil
  FROM public.pupils
  WHERE id = p_pupil_id AND auth_user_id = auth.uid()
  LIMIT 1;

  IF v_caller_pupil IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authorised');
  END IF;

  -- Lock the offer row
  SELECT * INTO v_offer FROM public.slot_offers WHERE id = p_offer_id FOR UPDATE;
  IF v_offer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_offer.status <> 'open' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_filled');
  END IF;

  IF v_offer.expires_at IS NOT NULL AND v_offer.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  -- Check recipient row
  SELECT * INTO v_recipient
  FROM public.slot_offer_recipients
  WHERE slot_offer_id = p_offer_id AND pupil_id = p_pupil_id
  FOR UPDATE;

  IF v_recipient.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_a_recipient');
  END IF;

  IF v_recipient.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- Pull pickup defaults from pupil
  SELECT pickup_address, postcode, pickup_lat, pickup_lng
    INTO v_pupil_pickup
  FROM public.pupils WHERE id = p_pupil_id;

  -- Create scheduled lesson
  INSERT INTO public.scheduled_lessons (
    instructor_id, pupil_id, lesson_date, start_time, duration_minutes,
    lesson_type, status, payment_status,
    pickup_location, pickup_postcode, pickup_lat, pickup_lng,
    notes, booking_status
  ) VALUES (
    v_offer.instructor_id, p_pupil_id, v_offer.lesson_date, v_offer.start_time, v_offer.duration_mins,
    'standard', 'confirmed', 'unpaid',
    v_pupil_pickup.pickup_address, v_pupil_pickup.postcode, v_pupil_pickup.pickup_lat, v_pupil_pickup.pickup_lng,
    'Grab a Gap claim', 'confirmed'
  )
  RETURNING id INTO v_lesson_id;

  -- Mark this recipient claimed
  UPDATE public.slot_offer_recipients
  SET claimed_at = now()
  WHERE id = v_recipient.id;

  -- Mark all other open recipients as declined
  UPDATE public.slot_offer_recipients
  SET declined_at = now()
  WHERE slot_offer_id = p_offer_id
    AND id <> v_recipient.id
    AND claimed_at IS NULL
    AND declined_at IS NULL;

  -- Mark offer filled
  UPDATE public.slot_offers
  SET status = 'filled',
      pupil_id = p_pupil_id,
      pupil_response = 'accepted',
      pupil_responded_at = now()
  WHERE id = p_offer_id;

  RETURN jsonb_build_object('success', true, 'lesson_id', v_lesson_id);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_slot_offer(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_slot_offer(uuid, uuid) TO authenticated;
