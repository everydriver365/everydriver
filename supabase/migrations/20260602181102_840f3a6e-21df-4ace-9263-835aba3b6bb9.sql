CREATE TABLE public.geotab_sync_cursors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  cursor_name TEXT NOT NULL,
  last_from_version TEXT,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, cursor_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.geotab_sync_cursors TO authenticated;
GRANT ALL ON public.geotab_sync_cursors TO service_role;

ALTER TABLE public.geotab_sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own geotab cursors"
ON public.geotab_sync_cursors
FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service role manages geotab cursors"
ON public.geotab_sync_cursors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_geotab_sync_cursors_instructor ON public.geotab_sync_cursors(instructor_id);

CREATE TRIGGER update_geotab_sync_cursors_updated_at
BEFORE UPDATE ON public.geotab_sync_cursors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();