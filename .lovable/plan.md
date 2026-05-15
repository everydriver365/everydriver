## Why registration fails

The form inserts into `public_test_swap_signups` and then chains `.select("id").single()`. The insert itself is allowed (anon INSERT policy exists with `consent_given = true`), but PostgREST's `RETURNING` requires a matching **SELECT** policy. There is no SELECT policy for `anon`, so the returning step fails — the client sees an error and never navigates to `/test-swap/matches/:id`.

We don't want to open SELECT to the public (the table contains email, phone, full name — PII).

## Fix

1. **Add a SECURITY DEFINER RPC** `submit_public_test_swap_signup(p_payload jsonb)` that:
   - Validates `consent_given = true` (rejects otherwise).
   - Validates required fields (`full_name`, `email`, `phone`, `earliest_new_date`, `latest_new_date`).
   - Inserts the row, returns the new `id` (uuid).
   - Granted EXECUTE to `anon, authenticated`.

2. **Update `src/pages/TestSwapRegister.tsx`** to call `supabase.rpc("submit_public_test_swap_signup", { p_payload: parsed.data })` instead of `.from(...).insert(...).select().single()`. Use the returned id to navigate to `/test-swap/matches/:id`.

3. Leave the existing INSERT RLS policy in place as belt-and-braces (RPC bypasses it via SECURITY DEFINER, but keeping the policy means we don't accidentally lock out other paths).

## Out of scope
- No changes to matches page, notifications, or admin views.
- No SELECT policy widening — PII stays protected.

## Files changed
- New migration adding the RPC.
- `src/pages/TestSwapRegister.tsx` — swap insert call for the RPC.