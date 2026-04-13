ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS klarna_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS clearpay_enabled boolean NOT NULL DEFAULT false;