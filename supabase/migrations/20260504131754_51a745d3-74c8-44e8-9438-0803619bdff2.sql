ALTER TABLE public.famulor_settings
  ADD COLUMN IF NOT EXISTS auto_fallback_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_fallback_channel text NOT NULL DEFAULT 'whatsapp_first',
  ADD COLUMN IF NOT EXISTS fallback_template text,
  ADD COLUMN IF NOT EXISTS draft_followup_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.famulor_settings
  DROP CONSTRAINT IF EXISTS famulor_settings_auto_fallback_channel_check;
ALTER TABLE public.famulor_settings
  ADD CONSTRAINT famulor_settings_auto_fallback_channel_check
  CHECK (auto_fallback_channel IN ('whatsapp_first','sms_only'));