UPDATE public.payment_history
SET payment_type = 'lesson_payment'
WHERE amount > 0 AND payment_type IS NULL;

UPDATE public.payment_history
SET payment_type = 'refund'
WHERE amount < 0 AND payment_type IS NULL;