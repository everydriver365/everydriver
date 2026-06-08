
ALTER TABLE public.payment_history DROP CONSTRAINT IF EXISTS payment_history_payment_type_check;
ALTER TABLE public.payment_history ADD CONSTRAINT payment_history_payment_type_check
  CHECK (payment_type IS NULL OR payment_type = ANY (ARRAY[
    'lesson_payment','platform_fee','commission','refund','adjustment',
    'subscription','no_show_fee','cancellation_fee',
    'intensive_hours','prepaid_hours'
  ]));
