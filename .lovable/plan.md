## Problem

Sending a quote fails with: `new row violates row-level security policy for table "quote_activity_log"`.

The `quote_activity_log` table only has a SELECT policy — no INSERT policy exists. Inserts happen via the `quotes_log_status_change` trigger that fires on INSERT/UPDATE of `quotes`. The trigger function is NOT `SECURITY DEFINER`, so it runs as the instructor and gets blocked by RLS.

## Fix

Single migration to make trigger writes succeed without opening the table to client writes:

1. Recreate `public.quotes_log_status_change()` with `SECURITY DEFINER` + `SET search_path = public` (same body as today). This lets the trigger insert audit rows on the user's behalf, which is the correct pattern for audit logs.
2. Keep `quote_activity_log` insert-locked to clients (no new INSERT policy) — only the trigger writes to it. Existing SELECT policy stays.
3. Add a comment on the table noting it's trigger-managed.

No app/code changes needed. No edits to the activity log table schema.