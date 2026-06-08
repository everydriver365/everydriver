
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
    'Free','Refund','Manual Credit','Adjustment','Voucher','Gift',
    'Intensive Hours','Prepaid Hours'
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
