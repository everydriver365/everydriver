
ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS preferred_duration_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS communication_preference text DEFAULT 'sms';
