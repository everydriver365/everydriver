
ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS payment_type text;

ALTER TABLE public.payment_history
  ADD CONSTRAINT payment_history_payment_type_check
  CHECK (
    payment_type IS NULL
    OR payment_type IN (
      'lesson_payment',
      'platform_fee',
      'commission',
      'refund',
      'adjustment',
      'subscription',
      'no_show_fee',
      'cancellation_fee'
    )
  );

CREATE INDEX IF NOT EXISTS payment_history_payment_type_idx
  ON public.payment_history (payment_type)
  WHERE payment_type IS NOT NULL;
