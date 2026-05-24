
-- 1. Discount + source link on slot_offers (mirrors gap_offers fields)
ALTER TABLE public.slot_offers
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric,
  ADD COLUMN IF NOT EXISTS gap_offer_id uuid REFERENCES public.gap_offers(id) ON DELETE SET NULL;

ALTER TABLE public.slot_offers
  DROP CONSTRAINT IF EXISTS slot_offers_discount_type_check;
ALTER TABLE public.slot_offers
  ADD CONSTRAINT slot_offers_discount_type_check
  CHECK (discount_type IS NULL OR discount_type IN ('percentage','fixed'));

CREATE INDEX IF NOT EXISTS idx_slot_offers_gap_offer ON public.slot_offers(gap_offer_id);

-- 2. Discount + booking method on scheduled_lessons
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS booking_method text;

ALTER TABLE public.scheduled_lessons
  DROP CONSTRAINT IF EXISTS scheduled_lessons_discount_type_check;
ALTER TABLE public.scheduled_lessons
  ADD CONSTRAINT scheduled_lessons_discount_type_check
  CHECK (discount_type IS NULL OR discount_type IN ('percentage','fixed'));

-- 3. Rewrite claim_slot_offer with pricing + discount + booking_method
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
  v_pupil record;
  v_instructor_rate numeric;
  v_postcode_rate numeric;
  v_hourly_rate numeric;
  v_outward text;
  v_base_amount numeric;
  v_discount_amount numeric := 0;
  v_final_amount numeric;
  v_duration int;
BEGIN
  -- Verify caller owns this pupil
  SELECT id INTO v_caller_pupil
  FROM public.pupils
  WHERE id = p_pupil_id AND auth_user_id = auth.uid()
  LIMIT 1;

  IF v_caller_pupil IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authorised');
  END IF;

  -- Lock the offer
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

  -- Recipient row
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

  -- Pull pupil info (pickup + custom rates + postcode)
  SELECT pickup_address, postcode, pickup_lat, pickup_lng,
         custom_hourly_rate, custom_rate_90min, custom_rate_120min
    INTO v_pupil
  FROM public.pupils WHERE id = p_pupil_id;

  v_duration := COALESCE(v_offer.duration_mins, 60);

  -- Resolve hourly rate (priority: pupil custom -> postcode rule -> instructor default)
  v_hourly_rate := NULL;
  v_base_amount := NULL;

  -- Pupil duration-specific rate gives the lesson price directly
  IF v_duration = 90 AND v_pupil.custom_rate_90min IS NOT NULL AND v_pupil.custom_rate_90min > 0 THEN
    v_base_amount := v_pupil.custom_rate_90min;
    v_hourly_rate := ROUND((v_base_amount * 60.0 / v_duration)::numeric, 2);
  ELSIF v_duration = 120 AND v_pupil.custom_rate_120min IS NOT NULL AND v_pupil.custom_rate_120min > 0 THEN
    v_base_amount := v_pupil.custom_rate_120min;
    v_hourly_rate := ROUND((v_base_amount * 60.0 / v_duration)::numeric, 2);
  ELSIF v_pupil.custom_hourly_rate IS NOT NULL AND v_pupil.custom_hourly_rate > 0 THEN
    v_hourly_rate := v_pupil.custom_hourly_rate;
  END IF;

  -- Postcode-rule rate
  IF v_hourly_rate IS NULL AND v_pupil.postcode IS NOT NULL THEN
    v_outward := upper(regexp_replace(v_pupil.postcode, '\s+', '', 'g'));
    IF length(v_outward) >= 4 THEN
      v_outward := substr(v_outward, 1, length(v_outward) - 3);
      SELECT hourly_rate INTO v_postcode_rate
      FROM public.instructor_postcode_rates
      WHERE instructor_id = v_offer.instructor_id
        AND upper(outward_code) = v_outward
      LIMIT 1;
      IF v_postcode_rate IS NOT NULL AND v_postcode_rate > 0 THEN
        v_hourly_rate := v_postcode_rate;
      END IF;
    END IF;
  END IF;

  -- Instructor default
  IF v_hourly_rate IS NULL THEN
    SELECT hourly_rate INTO v_instructor_rate
    FROM public.instructors WHERE id = v_offer.instructor_id;
    IF v_instructor_rate IS NOT NULL AND v_instructor_rate > 0 THEN
      v_hourly_rate := v_instructor_rate;
    END IF;
  END IF;

  -- Compute base amount if not already set by duration-specific rate
  IF v_base_amount IS NULL AND v_hourly_rate IS NOT NULL THEN
    v_base_amount := ROUND((v_hourly_rate * v_duration / 60.0)::numeric, 2);
  END IF;

  -- Apply discount
  IF v_base_amount IS NOT NULL AND v_offer.discount_type IS NOT NULL AND v_offer.discount_value IS NOT NULL THEN
    IF v_offer.discount_type = 'percentage' THEN
      v_discount_amount := ROUND((v_base_amount * v_offer.discount_value / 100.0)::numeric, 2);
    ELSIF v_offer.discount_type = 'fixed' THEN
      v_discount_amount := LEAST(v_offer.discount_value, v_base_amount);
    END IF;
  END IF;

  v_final_amount := GREATEST(COALESCE(v_base_amount, 0) - v_discount_amount, 0);

  -- Create scheduled lesson with pricing + discount + booking method
  INSERT INTO public.scheduled_lessons (
    instructor_id, pupil_id, lesson_date, start_time, duration_minutes,
    lesson_type, status, payment_status,
    pickup_location, pickup_postcode, pickup_lat, pickup_lng,
    notes, booking_status,
    price_per_hour, amount_due,
    discount_type, discount_value, discount_amount,
    booking_method
  ) VALUES (
    v_offer.instructor_id, p_pupil_id, v_offer.lesson_date, v_offer.start_time, v_duration,
    'Standard Lesson', 'confirmed', 'not_paid',
    v_pupil.pickup_address, v_pupil.postcode, v_pupil.pickup_lat, v_pupil.pickup_lng,
    CASE
      WHEN v_offer.discount_type IS NOT NULL
        THEN 'Grab a Gap claim (' ||
             CASE WHEN v_offer.discount_type = 'percentage'
                  THEN v_offer.discount_value::text || '% off'
                  ELSE '£' || v_offer.discount_value::text || ' off' END || ')'
      ELSE 'Grab a Gap claim'
    END,
    'confirmed',
    v_hourly_rate, v_final_amount,
    v_offer.discount_type, v_offer.discount_value, v_discount_amount,
    'gap_portal'
  )
  RETURNING id INTO v_lesson_id;

  -- Mark this recipient claimed
  UPDATE public.slot_offer_recipients
  SET claimed_at = now()
  WHERE id = v_recipient.id;

  -- Decline other open recipients on this offer
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

  -- Mark mirrored gap_offers as accepted too (so the SMS pipeline doesn't keep sending)
  IF v_offer.gap_offer_id IS NOT NULL THEN
    UPDATE public.gap_offers
    SET status = 'accepted',
        responded_at = now(),
        response_message = 'Claimed via Grab a Gap portal'
    WHERE id = v_offer.gap_offer_id AND status = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'lesson_id', v_lesson_id,
    'amount_due', v_final_amount,
    'discount_amount', v_discount_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_slot_offer(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_slot_offer(uuid, uuid) TO authenticated;
