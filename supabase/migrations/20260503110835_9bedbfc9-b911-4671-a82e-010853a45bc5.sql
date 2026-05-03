ALTER TABLE public.instructor_pinned_tiles
  DROP CONSTRAINT IF EXISTS instructor_pinned_tiles_position_check;

ALTER TABLE public.instructor_pinned_tiles
  ADD CONSTRAINT instructor_pinned_tiles_position_check CHECK (position >= 0);