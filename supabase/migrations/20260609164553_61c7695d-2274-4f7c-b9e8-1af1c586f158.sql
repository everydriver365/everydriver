ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS is_cpd_certified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS follows_code_of_practice boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS wants_featured boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_durations int[] DEFAULT '{60,120}';