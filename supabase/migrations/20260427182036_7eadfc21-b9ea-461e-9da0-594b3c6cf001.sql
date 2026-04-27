
-- 1. Funnel events log
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_instructor ON public.funnel_events(instructor_id, event_name, occurred_at DESC);
CREATE INDEX idx_funnel_events_event ON public.funnel_events(event_name, occurred_at DESC);

-- One-shot guard for first_* events
CREATE UNIQUE INDEX idx_funnel_events_first_unique
  ON public.funnel_events(instructor_id, event_name)
  WHERE event_name LIKE 'first_%';

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own funnel events" ON public.funnel_events
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own funnel events" ON public.funnel_events
  FOR INSERT TO authenticated
  WITH CHECK (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR instructor_id IS NULL
  );

CREATE POLICY "Admins view all funnel events" ON public.funnel_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Trigger: first pupil
CREATE OR REPLACE FUNCTION public.track_first_pupil()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.funnel_events (instructor_id, event_name, event_data)
  VALUES (NEW.instructor_id, 'first_pupil_added', jsonb_build_object('pupil_id', NEW.id))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_funnel_first_pupil
  AFTER INSERT ON public.pupils
  FOR EACH ROW EXECUTE FUNCTION public.track_first_pupil();

-- 3. Trigger: first scheduled lesson
CREATE OR REPLACE FUNCTION public.track_first_lesson()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.funnel_events (instructor_id, event_name, event_data)
  VALUES (NEW.instructor_id, 'first_lesson_scheduled', jsonb_build_object('lesson_id', NEW.id))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_funnel_first_lesson
  AFTER INSERT ON public.scheduled_lessons
  FOR EACH ROW EXECUTE FUNCTION public.track_first_lesson();

-- 4. Trigger: first payment
CREATE OR REPLACE FUNCTION public.track_first_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.instructor_id IS NOT NULL AND COALESCE(NEW.amount, 0) > 0 THEN
    INSERT INTO public.funnel_events (instructor_id, event_name, event_data)
    VALUES (NEW.instructor_id, 'first_payment_received', jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_funnel_first_payment
  AFTER INSERT ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.track_first_payment();

-- 5. Re-engagement log
CREATE TABLE public.pupil_reengagement_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  message_template TEXT,
  message_body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  resulted_in_booking BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reengagement_pupil_sent ON public.pupil_reengagement_log(pupil_id, sent_at DESC);
CREATE INDEX idx_reengagement_instructor_sent ON public.pupil_reengagement_log(instructor_id, sent_at DESC);

ALTER TABLE public.pupil_reengagement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own reengagement log" ON public.pupil_reengagement_log
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all reengagement log" ON public.pupil_reengagement_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Save offers
CREATE TABLE public.subscription_save_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  from_plan_slug TEXT NOT NULL,
  to_plan_slug TEXT NOT NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('discount_50_3mo', 'pause_30d', 'pause_60d')),
  offer_value JSONB DEFAULT '{}'::jsonb,
  shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_save_offers_instructor ON public.subscription_save_offers(instructor_id, shown_at DESC);

ALTER TABLE public.subscription_save_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own save offers" ON public.subscription_save_offers
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all save offers" ON public.subscription_save_offers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. Instructor preference: auto re-engage dormant pupils
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS auto_reengage_dormant BOOLEAN NOT NULL DEFAULT false;

-- 8. Subscription pause / save discount fields
ALTER TABLE public.instructor_subscriptions
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resume_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS save_discount_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS save_discount_percent INTEGER;

-- 9. RPC to check save offer eligibility (one offer per 12 months)
CREATE OR REPLACE FUNCTION public.check_save_offer_eligibility(p_instructor_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.subscription_save_offers
    WHERE instructor_id = p_instructor_id
      AND shown_at > now() - interval '12 months'
  );
END;
$$;
