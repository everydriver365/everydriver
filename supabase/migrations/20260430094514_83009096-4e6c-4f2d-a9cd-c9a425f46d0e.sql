-- Pinned tiles for "Frequently used" section on instructor mobile home
CREATE TABLE public.instructor_pinned_tiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  tile_id TEXT NOT NULL,
  position SMALLINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT instructor_pinned_tiles_instructor_tile_unique UNIQUE (instructor_id, tile_id),
  CONSTRAINT instructor_pinned_tiles_position_check CHECK (position >= 0 AND position <= 5)
);

CREATE INDEX idx_instructor_pinned_tiles_instructor
  ON public.instructor_pinned_tiles (instructor_id, position);

ALTER TABLE public.instructor_pinned_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own pinned tiles"
  ON public.instructor_pinned_tiles
  FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can insert their own pinned tiles"
  ON public.instructor_pinned_tiles
  FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update their own pinned tiles"
  ON public.instructor_pinned_tiles
  FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can delete their own pinned tiles"
  ON public.instructor_pinned_tiles
  FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER update_instructor_pinned_tiles_updated_at
  BEFORE UPDATE ON public.instructor_pinned_tiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();