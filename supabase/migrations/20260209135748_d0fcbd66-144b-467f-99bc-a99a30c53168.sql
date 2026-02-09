
ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS eyesight_checked boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS needs_glasses boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS special_needs text DEFAULT null,
  ADD COLUMN IF NOT EXISTS dvla_check_code text DEFAULT null,
  ADD COLUMN IF NOT EXISTS previous_experience text DEFAULT null,
  ADD COLUMN IF NOT EXISTS licence_photo_url text DEFAULT null,
  ADD COLUMN IF NOT EXISTS checklist_completed_at timestamptz DEFAULT null;
