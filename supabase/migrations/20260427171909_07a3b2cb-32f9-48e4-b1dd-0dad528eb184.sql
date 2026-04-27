ALTER TABLE public.pupil_signatures
  ADD COLUMN IF NOT EXISTS terms_content_snapshot text,
  ADD COLUMN IF NOT EXISTS terms_version_snapshot integer,
  ADD COLUMN IF NOT EXISTS terms_title_snapshot text;