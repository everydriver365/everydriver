ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS custom_rate_90min numeric,
  ADD COLUMN IF NOT EXISTS custom_rate_120min numeric;

COMMENT ON COLUMN public.pupils.custom_hourly_rate IS 'Custom price for a 60-minute lesson (overrides instructor default).';
COMMENT ON COLUMN public.pupils.custom_rate_90min IS 'Custom price for a 90-minute lesson (overrides instructor default).';
COMMENT ON COLUMN public.pupils.custom_rate_120min IS 'Custom price for a 120-minute lesson (overrides instructor default).';