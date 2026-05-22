ALTER TABLE public.account_deletion_requests
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS cancel_token text;

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_pending_purge
  ON public.account_deletion_requests (scheduled_purge_at)
  WHERE cancelled_at IS NULL AND completed_at IS NULL;