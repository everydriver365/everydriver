CREATE OR REPLACE FUNCTION public.increment_drive_coins(p_pupil_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pupils SET drive_coins = COALESCE(drive_coins, 0) + p_amount WHERE id = p_pupil_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_drive_coins(uuid, integer) TO authenticated, service_role;