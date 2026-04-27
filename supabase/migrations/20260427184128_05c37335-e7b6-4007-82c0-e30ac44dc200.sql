-- ============================================================
-- 1. Cover Marketplace — create tables first, policies after
-- ============================================================

CREATE TABLE public.cover_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  requesting_instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  lesson_start TIMESTAMPTZ NOT NULL,
  lesson_duration_minutes INTEGER NOT NULL,
  lesson_price NUMERIC(10,2),
  pickup_lat NUMERIC(10,7),
  pickup_lng NUMERIC(10,7),
  pickup_postcode TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  claimed_by_instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  finders_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 15,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cover_offers_status_check CHECK (status IN ('open','claimed','expired','cancelled'))
);

CREATE INDEX idx_cover_offers_status_lesson ON public.cover_offers(status, lesson_start);
CREATE INDEX idx_cover_offers_requesting ON public.cover_offers(requesting_instructor_id);
CREATE UNIQUE INDEX idx_cover_offers_one_open_per_lesson ON public.cover_offers(lesson_id) WHERE status = 'open';

CREATE TABLE public.cover_offer_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_offer_id UUID NOT NULL REFERENCES public.cover_offers(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  distance_miles NUMERIC(6,2),
  notified_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cover_offer_id, instructor_id)
);

CREATE INDEX idx_cover_recipients_instructor ON public.cover_offer_recipients(instructor_id);

CREATE TABLE public.cover_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_offer_id UUID NOT NULL REFERENCES public.cover_offers(id) ON DELETE CASCADE,
  payer_instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  payee_instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'owed',
  settled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cover_settlements_status_check CHECK (status IN ('owed','settled','waived'))
);

CREATE INDEX idx_cover_settlements_payer ON public.cover_settlements(payer_instructor_id, status);
CREATE INDEX idx_cover_settlements_payee ON public.cover_settlements(payee_instructor_id, status);

-- Enable RLS
ALTER TABLE public.cover_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_offer_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_settlements ENABLE ROW LEVEL SECURITY;

-- cover_offers policies
CREATE POLICY "cover_offers admins full"
  ON public.cover_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "cover_offers requesting instructor manage"
  ON public.cover_offers FOR ALL TO authenticated
  USING (requesting_instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (requesting_instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "cover_offers recipients can read"
  ON public.cover_offers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_offer_recipients r
      WHERE r.cover_offer_id = cover_offers.id
        AND r.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

CREATE POLICY "cover_offers claimer can read"
  ON public.cover_offers FOR SELECT TO authenticated
  USING (claimed_by_instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- cover_offer_recipients policies
CREATE POLICY "cover_recipients admins full"
  ON public.cover_offer_recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "cover_recipients self read"
  ON public.cover_offer_recipients FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "cover_recipients self update"
  ON public.cover_offer_recipients FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "cover_recipients requesting instructor read"
  ON public.cover_offer_recipients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_offers o
      WHERE o.id = cover_offer_recipients.cover_offer_id
        AND o.requesting_instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- cover_settlements policies
CREATE POLICY "cover_settlements admins full"
  ON public.cover_settlements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "cover_settlements parties read"
  ON public.cover_settlements FOR SELECT TO authenticated
  USING (
    payer_instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR payee_instructor_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE TRIGGER cover_offers_set_updated_at
  BEFORE UPDATE ON public.cover_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Instructor preferences
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS accepts_cover_lessons BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_max_distance_miles INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS cover_min_notice_hours INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS cover_finders_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 15;

-- Atomic claim RPC
CREATE OR REPLACE FUNCTION public.claim_cover_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id UUID;
  v_offer RECORD;
  v_settlement_amount NUMERIC(10,2);
BEGIN
  v_instructor_id := public.get_instructor_id_for_user(auth.uid());
  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Not an instructor';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_offer_id::text));

  SELECT * INTO v_offer FROM public.cover_offers WHERE id = p_offer_id FOR UPDATE;

  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.status <> 'open' THEN RAISE EXCEPTION 'Offer no longer available (status=%)', v_offer.status; END IF;
  IF v_offer.expires_at < now() THEN
    UPDATE public.cover_offers SET status='expired' WHERE id = p_offer_id;
    RAISE EXCEPTION 'Offer expired';
  END IF;
  IF v_offer.requesting_instructor_id = v_instructor_id THEN
    RAISE EXCEPTION 'Cannot claim your own offer';
  END IF;

  UPDATE public.cover_offers
    SET status='claimed',
        claimed_by_instructor_id = v_instructor_id,
        claimed_at = now()
    WHERE id = p_offer_id;

  UPDATE public.scheduled_lessons
    SET instructor_id = v_instructor_id,
        updated_at = now()
    WHERE id = v_offer.lesson_id;

  v_settlement_amount := ROUND(COALESCE(v_offer.lesson_price,0) * (v_offer.finders_fee_pct/100.0), 2);
  IF v_settlement_amount > 0 THEN
    INSERT INTO public.cover_settlements (
      cover_offer_id, payer_instructor_id, payee_instructor_id, amount, notes
    ) VALUES (
      p_offer_id, v_instructor_id, v_offer.requesting_instructor_id, v_settlement_amount,
      'Cover finder''s fee (' || v_offer.finders_fee_pct || '%)'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'offer_id', p_offer_id,
    'lesson_id', v_offer.lesson_id,
    'settlement_amount', v_settlement_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_cover_offer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_cover_offer(UUID) TO authenticated;

-- ============================================================
-- 2. Pupil referral £10 credit upgrade
-- ============================================================

ALTER TABLE public.pupil_referrals
  ADD COLUMN IF NOT EXISTS referrer_credit_amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS referred_credit_amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS credit_awarded_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.award_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.pupils
      SET reward_points = COALESCE(reward_points, 0) + 100
      WHERE id = NEW.referrer_pupil_id;

    NEW.bonus_points_awarded := 100;

    IF NEW.credit_awarded_at IS NULL THEN
      PERFORM public.increment_pupil_balance(NEW.referrer_pupil_id, NEW.referrer_credit_amount);
      PERFORM public.increment_pupil_balance(NEW.referred_pupil_id, NEW.referred_credit_amount);
      NEW.credit_awarded_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Pass report PDF
-- ============================================================

ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS pass_report_url TEXT,
  ADD COLUMN IF NOT EXISTS pass_report_generated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.pass_report_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT pass_report_queue_status_check CHECK (status IN ('pending','processing','done','failed'))
);

CREATE INDEX IF NOT EXISTS idx_pass_report_queue_pending ON public.pass_report_queue(status, created_at) WHERE status = 'pending';

ALTER TABLE public.pass_report_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pass_report_queue admins"
  ON public.pass_report_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.enqueue_pass_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.test_passed = true AND (OLD.test_passed IS DISTINCT FROM true) THEN
    INSERT INTO public.pass_report_queue (pupil_id) VALUES (NEW.id);

    BEGIN
      INSERT INTO public.funnel_events (instructor_id, event_name, event_data)
      VALUES (NEW.instructor_id, 'pupil_test_passed',
              jsonb_build_object('pupil_id', NEW.id));
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_pass_report ON public.pupils;
CREATE TRIGGER trg_enqueue_pass_report
  AFTER UPDATE OF test_passed ON public.pupils
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_pass_report();

-- Storage bucket for pass reports (public for sharing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pass-reports', 'pass-reports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pass-reports public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pass-reports');

CREATE POLICY "pass-reports service write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pass-reports' AND public.has_role(auth.uid(), 'admin'::public.app_role));