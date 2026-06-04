## Problem

Submitting the enquiry form on `/booking/chapmans` → course detail page fails with:

```
POST /rest/v1/booking_enquiries → 401
code: 42501
"new row violates row-level security policy for table booking_enquiries"
```

The RLS policies on `public.booking_enquiries` are correct:
- INSERT: `Anyone can submit an enquiry` for `anon, authenticated` (`with_check: true`)
- SELECT/UPDATE: scoped to the owning instructor

But `information_schema.role_table_grants` shows **zero grants** on the table, so PostgREST returns 42501 before RLS even runs. This violates the project's "every public table needs explicit GRANTs" rule.

## Fix

Single migration that adds the missing grants. RLS is already enabled and policies already exist — no policy changes needed.

```sql
GRANT INSERT ON public.booking_enquiries TO anon;
GRANT INSERT, SELECT, UPDATE ON public.booking_enquiries TO authenticated;
GRANT ALL ON public.booking_enquiries TO service_role;
```

Notes:
- `anon` only gets `INSERT` (public form submissions) — reads stay locked down by RLS.
- `authenticated` gets `SELECT`/`UPDATE` so the instructor portal can view/manage their own enquiries (RLS already scopes to `get_instructor_id_for_user(auth.uid())`).
- `service_role` gets `ALL` for edge functions / admin code.

## Verification

After the migration:
1. Re-submit the enquiry form on Chapmans as Fred Bloggs — expect success state, no 401.
2. Confirm the row appears in `booking_enquiries`.
3. Confirm anon still cannot SELECT from the table (RLS unchanged).

## Out of scope

- No payment flow exists on the Chapmans course detail page (enquiry-only by design). Not changing that here. If you want a Book/Pay CTA added, that's a separate task.
