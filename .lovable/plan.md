## Remaining gap

The previous fix lets people submit, but the success page (`/test-swap/matches/:signupId`) still hits the same RLS wall: it does a direct `.from("public_test_swap_signups").select(...).eq("id", signupId).maybeSingle()` to load the "me" row. Anon has no SELECT policy on that table, so `meRes.data` is `null` → page renders "Registration not found" right after a successful signup.

The other two RPCs the page uses (`get_test_swap_matches`, `request_test_swap`) are SECURITY DEFINER and granted to PUBLIC, so they already work.

## Fix

1. **New SECURITY DEFINER RPC** `get_public_test_swap_signup_self(p_id uuid)` returning only the non-PII fields the matches page renders:
   `id, full_name, current_centre_name, current_test_date, current_test_time, earliest_new_date, latest_new_date, has_test_booked`.
   No email or phone exposed. Granted to `anon, authenticated`.

2. **Update `src/pages/TestSwapMatches.tsx`** — replace the direct table select with `supabase.rpc("get_public_test_swap_signup_self", { p_id: signupId })`. Keep the `notFound` handling.

## Verification (after build)
- Submit form → navigates to `/test-swap/matches/:id`.
- Matches page loads "me" row + matches without RLS errors.
- "Request swap" button still works (already uses RPC).

## Out of scope
- No SELECT policy widening on the base table; PII stays protected.
- No changes to register form, schema, edge functions, or admin views.