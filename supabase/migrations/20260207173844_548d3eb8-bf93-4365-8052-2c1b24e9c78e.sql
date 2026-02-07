
-- 1. Add soft delete columns to critical tables
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.lesson_history ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.scheduled_lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.instructor_expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create audit log table
CREATE TABLE IF NOT EXISTS public.data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'soft_delete', 'restore')),
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own audit logs"
  ON public.data_audit_log FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can insert their own audit logs"
  ON public.data_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_pupils_instructor_deleted ON public.pupils (instructor_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_lesson_history_instructor_date_deleted ON public.lesson_history (instructor_id, lesson_date, deleted_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_instructor_date_deleted ON public.scheduled_lessons (instructor_id, lesson_date, deleted_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_instructor_date_deleted ON public.payment_history (instructor_id, recorded_at, deleted_at);
CREATE INDEX IF NOT EXISTS idx_instructor_expenses_instructor_date_deleted ON public.instructor_expenses (instructor_id, expense_date, deleted_at);

-- Index on audit log for lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_instructor ON public.data_audit_log (instructor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.data_audit_log (table_name, record_id);
