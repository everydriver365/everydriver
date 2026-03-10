ALTER TABLE public.instructors ADD COLUMN deleted_at timestamptz DEFAULT NULL;
CREATE INDEX idx_instructors_deleted_at ON public.instructors (deleted_at) WHERE deleted_at IS NULL;