
-- Add GoCardless feature toggles to instructors
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS instant_bank_pay_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS direct_debit_enabled boolean NOT NULL DEFAULT false;

-- Add GoCardless columns to pupil_subscriptions
ALTER TABLE public.pupil_subscriptions ADD COLUMN IF NOT EXISTS gocardless_mandate_id text;
ALTER TABLE public.pupil_subscriptions ADD COLUMN IF NOT EXISTS gocardless_customer_id text;

-- Add GoCardless payment ID to payment_intents
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS gocardless_payment_id text;
