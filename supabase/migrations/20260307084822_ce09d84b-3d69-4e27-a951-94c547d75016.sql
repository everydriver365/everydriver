CREATE OR REPLACE FUNCTION public.increment_pupil_balance(p_pupil_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  UPDATE public.pupils
  SET account_balance = COALESCE(account_balance, 0) + p_amount
  WHERE id = p_pupil_id
  RETURNING account_balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;