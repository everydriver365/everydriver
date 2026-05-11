ALTER TABLE public.platform_fees
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'booking_fee';

CREATE INDEX IF NOT EXISTS idx_platform_fees_kind_created ON public.platform_fees (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_fees_payment_method ON public.platform_fees (payment_method);

UPDATE public.platform_fees SET kind = 'booking_fee' WHERE kind IS NULL OR kind = '';

-- Add unique constraint on commission_type so future upserts work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_commission_config_commission_type_key'
  ) THEN
    ALTER TABLE public.platform_commission_config
      ADD CONSTRAINT platform_commission_config_commission_type_key UNIQUE (commission_type);
  END IF;
END $$;

INSERT INTO public.platform_commission_config (commission_type, rate_percent, fixed_fee_pence, is_active)
VALUES
  ('klarna_uplift',   1.0, 0, true),
  ('clearpay_uplift', 1.0, 0, true)
ON CONFLICT (commission_type) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_platform_fee_for_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_method_lower text;
  v_klarna_rate numeric;
  v_clearpay_rate numeric;
  v_uplift_amount numeric;
  v_is_digital boolean;
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  v_method_lower := lower(coalesce(NEW.payment_method, ''));

  v_is_digital := v_method_lower NOT IN (
    'cash', 'lesson charge', 'free', 'refund', 'manual', 'manual_credit',
    'adjustment', 'credit', 'correction', 'course bonus', 'voucher', 'gift'
  );

  IF NOT v_is_digital THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.platform_fees (
    pupil_id, instructor_id, amount, currency, source, payment_method, kind, notes
  ) VALUES (
    NEW.pupil_id, NEW.instructor_id, 1.00, 'GBP',
    'payment_history', NEW.payment_method, 'transaction_fee',
    'Auto: £1 platform fee on payment_history #' || NEW.id::text
  );

  IF v_method_lower LIKE '%klarna%' THEN
    SELECT rate_percent INTO v_klarna_rate
      FROM public.platform_commission_config
      WHERE commission_type = 'klarna_uplift' AND is_active = true
      LIMIT 1;
    IF v_klarna_rate IS NOT NULL AND v_klarna_rate > 0 THEN
      v_uplift_amount := round((NEW.amount * (v_klarna_rate / 100.0))::numeric, 2);
      IF v_uplift_amount > 0 THEN
        INSERT INTO public.platform_fees (
          pupil_id, instructor_id, amount, currency, source, payment_method, kind, notes
        ) VALUES (
          NEW.pupil_id, NEW.instructor_id, v_uplift_amount, 'GBP',
          'payment_history', NEW.payment_method, 'klarna_uplift',
          'Auto: ' || v_klarna_rate || '% Klarna uplift on £' || NEW.amount::text
        );
      END IF;
    END IF;
  ELSIF v_method_lower LIKE '%clearpay%' OR v_method_lower LIKE '%pay in 4%' THEN
    SELECT rate_percent INTO v_clearpay_rate
      FROM public.platform_commission_config
      WHERE commission_type = 'clearpay_uplift' AND is_active = true
      LIMIT 1;
    IF v_clearpay_rate IS NOT NULL AND v_clearpay_rate > 0 THEN
      v_uplift_amount := round((NEW.amount * (v_clearpay_rate / 100.0))::numeric, 2);
      IF v_uplift_amount > 0 THEN
        INSERT INTO public.platform_fees (
          pupil_id, instructor_id, amount, currency, source, payment_method, kind, notes
        ) VALUES (
          NEW.pupil_id, NEW.instructor_id, v_uplift_amount, 'GBP',
          'payment_history', NEW.payment_method, 'clearpay_uplift',
          'Auto: ' || v_clearpay_rate || '% Clearpay uplift on £' || NEW.amount::text
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_history_platform_fee ON public.payment_history;
CREATE TRIGGER trg_payment_history_platform_fee
  AFTER INSERT ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.record_platform_fee_for_payment();