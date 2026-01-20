-- Add deposit settings to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS deposit_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 350,
ADD COLUMN IF NOT EXISTS deposit_deadline_days integer DEFAULT 30;

-- Add deposit tracking to pupils table
ALTER TABLE public.pupils
ADD COLUMN IF NOT EXISTS payment_type text,
ADD COLUMN IF NOT EXISTS deposit_paid numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due_date date,
ADD COLUMN IF NOT EXISTS deposit_forfeited boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.instructors.deposit_enabled IS 'Whether instructor accepts deposit payments';
COMMENT ON COLUMN public.instructors.deposit_amount IS 'Deposit amount in GBP';
COMMENT ON COLUMN public.instructors.deposit_deadline_days IS 'Days before first lesson that balance must be paid';
COMMENT ON COLUMN public.pupils.payment_type IS 'full or deposit';
COMMENT ON COLUMN public.pupils.balance_due_date IS 'Date by which remaining balance must be paid';
COMMENT ON COLUMN public.pupils.deposit_forfeited IS 'Whether deposit was forfeited due to non-payment';