
-- Stage 5: normalize payment_method values
UPDATE public.payment_history SET payment_method = CASE lower(payment_method)
  WHEN 'cash' THEN 'Cash'
  WHEN 'voice/cash' THEN 'Cash'
  WHEN 'card' THEN 'Square'
  WHEN 'square_checkout' THEN 'Square'
  WHEN 'square' THEN 'Square'
  WHEN 'square refund' THEN 'Square Refund'
  WHEN 'bank_transfer' THEN 'Bank Transfer'
  WHEN 'bank transfer' THEN 'Bank Transfer'
  WHEN 'klarna' THEN 'Klarna'
  WHEN 'clearpay' THEN 'Clearpay'
  WHEN 'sumup' THEN 'SumUp'
  WHEN 'gocardless_instant_bank_pay' THEN 'GoCardless Bank Pay'
  WHEN 'gocardless bank pay' THEN 'GoCardless Bank Pay'
  WHEN 'gocardless direct debit' THEN 'GoCardless Direct Debit'
  WHEN 'lesson charge' THEN 'Lesson Charge'
  WHEN 'course bonus' THEN 'Course Bonus'
  WHEN 'cancellation fee' THEN 'Cancellation Fee'
  WHEN 'no-show fee' THEN 'No-Show Fee'
  WHEN 'payment_link' THEN 'Square'
  WHEN 'free' THEN 'Free'
  ELSE payment_method
END
WHERE payment_method IS NOT NULL;

-- Validation trigger enforcing canonical values for new/updated rows
CREATE OR REPLACE FUNCTION public.validate_payment_method()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_allowed text[] := ARRAY[
    'Cash','Bank Transfer','Square','Square Refund',
    'GoCardless Bank Pay','GoCardless Direct Debit',
    'Klarna','Clearpay','SumUp',
    'Lesson Charge','Course Bonus','Cancellation Fee','No-Show Fee',
    'Free','Refund','Manual Credit','Adjustment','Voucher','Gift'
  ];
BEGIN
  IF NEW.payment_method IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT (NEW.payment_method = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid payment_method: %. Allowed: %', NEW.payment_method, v_allowed
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_payment_method_trg ON public.payment_history;
CREATE TRIGGER validate_payment_method_trg
BEFORE INSERT OR UPDATE OF payment_method ON public.payment_history
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_method();
