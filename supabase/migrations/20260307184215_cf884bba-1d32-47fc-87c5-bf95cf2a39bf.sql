
-- Accounting connections table
CREATE TABLE public.instructor_accounting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('xero', 'quickbooks', 'freeagent', 'sage')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  tenant_id TEXT,
  company_name TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, platform)
);

-- Sync log table
CREATE TABLE public.accounting_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('expenses', 'income', 'both')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  records_synced INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'success', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.instructor_accounting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own accounting connections"
  ON public.instructor_accounting_connections
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors view own sync logs"
  ON public.accounting_sync_log
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_updated_at_accounting_connections
  BEFORE UPDATE ON public.instructor_accounting_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
