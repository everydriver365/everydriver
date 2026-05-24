ALTER TABLE public.payment_history ALTER COLUMN payment_type SET DEFAULT 'lesson_payment';
UPDATE public.payment_history SET payment_type = 'lesson_payment' WHERE payment_type IS NULL;
ALTER TABLE public.payment_history ALTER COLUMN payment_type SET NOT NULL;